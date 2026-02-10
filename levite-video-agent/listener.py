import logging
import os
import subprocess
import json

import requests
from openai import OpenAI
from telegram import Update
from telegram.ext import Application, MessageHandler, filters, ContextTypes

# Configure logging
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = None

def generate_dalle_image(prompt: str) -> str:
    """Generate an image using DALL-E 3 and return the local filename."""
    try:
        logger.info(f"Generating DALL-E 3 image with prompt: {prompt}")
        
        # Create the full prompt with style prefix
        full_prompt = f"Minimalist vector line art, white lines on jet black background, thick strokes. Metaphorical concept: {prompt}"
        
        # Generate image using OpenAI DALL-E 3
        response = client.images.generate(
            model="dall-e-3",
            prompt=full_prompt,
            size="1024x1024",
            quality="standard",
            n=1
        )
        
        image_url = response.data[0].url
        logger.info(f"Image generated! URL: {image_url}")
        
        # Download the image
        # Using requests instead of urllib to avoid SSL certificate issues on Mac
        image_response = requests.get(image_url, timeout=30)
        image_response.raise_for_status()
        
        # Create public directory if it doesn't exist
        os.makedirs("public", exist_ok=True)
        
        output_path = "public/background.png"
        with open(output_path, "wb") as f:
            f.write(image_response.content)
        
        logger.info(f"Image downloaded to {output_path}")
        return "background.png"
        
    except Exception as e:
        logger.error(f"Error generating DALL-E image: {e}")
        return None

async def handle_voice(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handles voice messages, converts them, transcribes, generates video, and replies."""
    user = update.message.from_user
    logger.info(f"Received voice message from {user.first_name}")

    await update.message.reply_text("Processing your video...")

    # download the voice message
    voice_file = await update.message.voice.get_file()
    ogg_path = "voice.ogg"
    mp3_path = "voice.mp3"
    
    await voice_file.download_to_drive(ogg_path)
    logger.info(f"Downloaded voice message to {ogg_path}")

    try:
        # Convert OGG to MP3 using ffmpeg subprocess
        logger.info("Converting OGG to MP3...")
        subprocess.run(
            ["ffmpeg", "-y", "-i", ogg_path, mp3_path],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        logger.info("Conversion successful")

        # Transcribe using OpenAI API with word-level timestamps
        logger.info("Transcribing audio...")
        with open(mp3_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                timestamp_granularities=["word"],
                response_format="verbose_json"
            )
        
        text = transcription.text
        logger.info(f"Transcription: {text}")
        
        # Extract words and convert to plain dictionaries manually (Safe Conversion)
        raw_words = transcription.words
        clean_words = []
        for w in raw_words:
            clean_words.append({
                "word": w.word,
                "start": w.start,
                "end": w.end
            })

        # Save the CLEAN list to subtitles.json
        os.makedirs("public", exist_ok=True)
        with open("public/subtitles.json", "w") as f:
            json.dump(clean_words, f, indent=2)
        logger.info("Saved clean word timestamps to public/subtitles.json")
        
        # Reply with transcription
        await update.message.reply_text(f"I heard you say: {text}")

        # Generate visual prompt and create image with DALL-E 3
        await update.message.reply_text("Generating AI image...")
        
        image_filename = generate_dalle_image(text)
        
        if not image_filename:
            await update.message.reply_text("Image generation failed. Falling back to text-only render.")
            image_filename = None

        # Run Remotion render with transcription text and background image
        logger.info("Starting Remotion render...")
        props = json.dumps({
            "text": text,
            "visualAsset": image_filename if image_filename else None,
            "words": clean_words
        })
        render_command = ["npx", "remotion", "render", "KineticText", "out.mp4", "--props", props]
        
        try:
            subprocess.run(render_command, check=True, capture_output=True, text=True)
            logger.info("Render successful")
        except subprocess.CalledProcessError as e:
            logger.error(f"Remotion render failed with exit code {e.returncode}")
            logger.error(f"Stdout: {e.stdout}")
            logger.error(f"Stderr: {e.stderr}")
            raise  # Re-raise to be handled by outer try-except

        # Upload the rendered video
        out_path = "out.mp4"
        if os.path.exists(out_path):
             await update.message.reply_video(video=open(out_path, "rb"))
             logger.info("Video sent to user")
        else:
            logger.error("Rendered file not found")
            await update.message.reply_text("Error: Video file generation failed.")

    except Exception as e:
        logger.error(f"Error processing video: {e}")
        await update.message.reply_text(f"An error occurred: {str(e)}")

    finally:
        # Clean up temporary files
        for path in [ogg_path, mp3_path, "out.mp4", "public/background.png", "public/subtitles.json"]:
            if os.path.exists(path):
                os.remove(path)
                logger.info(f"Removed temporary file: {path}")

def main() -> None:
    """Start the bot."""
    global client
    
    # Load tokens from .env
    telegram_token = os.environ.get("TELEGRAM_BOT_TOKEN")
    openai_api_key = os.environ.get("OPENAI_API_KEY")
    
    if not telegram_token or not openai_api_key:
        try:
            with open(".env", "r") as f:
                for line in f:
                    if line.startswith("TELEGRAM_BOT_TOKEN="):
                        telegram_token = line.split("=", 1)[1].strip()
                    elif line.startswith("OPENAI_API_KEY="):
                        openai_api_key = line.split("=", 1)[1].strip()
        except FileNotFoundError:
            logger.error(".env file not found.")
            return

    if not telegram_token:
        logger.error("TELEGRAM_BOT_TOKEN not found in .env or environment variables")
        return
    
    if not openai_api_key:
        logger.error("OPENAI_API_KEY not found in .env or environment variables")
        return
    


    # Initialize OpenAI client
    client = OpenAI(api_key=openai_api_key)

    application = Application.builder().token(telegram_token).build()

    # Listen for voice messages
    application.add_handler(MessageHandler(filters.VOICE, handle_voice))

    logger.info("Bot is polling...")
    application.run_polling()

if __name__ == "__main__":
    main()

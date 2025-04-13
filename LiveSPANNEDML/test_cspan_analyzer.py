import cv2
import numpy as np
from pytube import YouTube
import os

# Test if we can import mediapipe successfully
import mediapipe as mp
print("MediaPipe imported successfully!")

# Test if we can import whisper successfully
import whisper
print("Whisper imported successfully!")

# Test if we can import transformers successfully
from transformers import pipeline
print("Transformers imported successfully!")

# Test video download function
def download_test_video(url, output_path="test_video.mp4"):
    """Download a short video for testing purposes"""
    try:
        print(f"Downloading video from {url}")
        youtube = YouTube(url)
        # Get the lowest resolution to speed up download
        stream = youtube.streams.filter(progressive=True, file_extension='mp4').order_by('resolution').first()
        video_path = stream.download(filename=output_path)
        print(f"Video saved to {video_path}")
        return video_path
    except Exception as e:
        print(f"Error downloading video: {e}")
        return None

# Test MediaPipe pose detection
def test_pose_detection(image_path=None):
    """Test MediaPipe pose detection on a sample image or frame"""
    mp_drawing = mp.solutions.drawing_utils
    mp_pose = mp.solutions.pose
    
    # Create a pose instance
    pose = mp_pose.Pose(
        static_image_mode=True,
        model_complexity=1,
        smooth_landmarks=True,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    )
    
    # If no image is provided, create a test frame
    if image_path is None or not os.path.exists(image_path):
        # Create a blank image
        img = np.zeros((480, 640, 3), dtype=np.uint8)
        # Draw a simple stick figure
        cv2.line(img, (320, 100), (320, 300), (255, 255, 255), 5)  # body
        cv2.line(img, (320, 200), (220, 150), (255, 255, 255), 5)  # left arm
        cv2.line(img, (320, 200), (420, 150), (255, 255, 255), 5)  # right arm
        cv2.line(img, (320, 300), (270, 400), (255, 255, 255), 5)  # left leg
        cv2.line(img, (320, 300), (370, 400), (255, 255, 255), 5)  # right leg
        cv2.circle(img, (320, 100), 50, (255, 255, 255), -1)  # head
        
        # Save the test image
        image_path = "test_image.jpg"
        cv2.imwrite(image_path, img)
        print(f"Created test image at {image_path}")
    
    # Read the image
    image = cv2.imread(image_path)
    if image is None:
        print(f"Failed to read image from {image_path}")
        return False
    
    # Convert to RGB
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    
    # Process the image
    results = pose.process(image_rgb)
    
    # Check if pose landmarks were detected
    if results.pose_landmarks:
        print("Pose landmarks detected!")
        
        # Draw pose landmarks
        annotated_image = image.copy()
        mp_drawing.draw_landmarks(
            annotated_image, 
            results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS,
            mp_drawing.DrawingSpec(color=(80, 110, 10), thickness=2, circle_radius=1),
            mp_drawing.DrawingSpec(color=(80, 256, 121), thickness=2, circle_radius=1)
        )
        
        # Save the annotated image
        output_path = "test_pose_detection.jpg"
        cv2.imwrite(output_path, annotated_image)
        print(f"Saved annotated image to {output_path}")
        return True
    else:
        print("No pose landmarks detected.")
        return False

if __name__ == "__main__":
    print("Testing CSPAN Analyzer components...")
    
    # Test MediaPipe pose detection
    test_pose_detection()
    
    # You can uncomment this to test video download (optional)
    # test_video_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Short video for testing
    # download_test_video(test_video_url)
    
    print("Test completed!")

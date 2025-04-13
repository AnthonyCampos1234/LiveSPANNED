import cv2
import mediapipe as mp
import numpy as np
import torch
from transformers import pipeline
import pytube
import whisper
import matplotlib.pyplot as plt
from datetime import datetime
import os

class CSPANAnalyzer:
    def __init__(self, video_path=None, url=None):
        """Initialize the CSPAN video analyzer with either a local path or YouTube URL."""
        self.video_path = video_path
        self.url = url
        
        # Initialize MediaPipe pose estimator for multiple people
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            static_image_mode=False,
            model_complexity=2,  # Use higher complexity model for better accuracy
            smooth_landmarks=True,
            enable_segmentation=True,  # Enable segmentation for better person isolation
            min_detection_confidence=0.7,  # Higher detection confidence
            min_tracking_confidence=0.7   # Higher tracking confidence
        )
        
        # Initialize speech recognition
        print("Loading Whisper model...")
        self.speech_model = whisper.load_model("base")
        
        # Initialize text analysis pipeline
        print("Loading NLP pipeline...")
        self.nlp = pipeline("summarization")
        self.topic_classifier = pipeline("zero-shot-classification")
        
        # Store analysis results
        self.pose_data = []
        self.speech_segments = []
        self.context_data = []
        self.output_video = None
        
    def download_from_youtube(self):
        """Download video from YouTube if URL is provided."""
        if not self.url:
            return False
            
        try:
            print(f"Downloading video from {self.url}")
            youtube = pytube.YouTube(self.url)
            stream = youtube.streams.filter(progressive=True, file_extension='mp4').order_by('resolution').desc().first()
            self.video_path = stream.download(filename=f"cspan_video_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4")
            print(f"Video saved to {self.video_path}")
            return True
        except Exception as e:
            print(f"Error downloading video: {e}")
            return False
    
    def process_video(self, output_path="cspan_analyzed.mp4", frame_skip=1):
        """Process the video with all analysis components."""
        if not self.video_path:
            if not self.download_from_youtube():
                print("No video to process")
                return False
                
        cap = cv2.VideoCapture(self.video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        frame_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        
        # Create output video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (frame_width, frame_height))
        
        # Batch audio for speech recognition
        print("Extracting audio for speech recognition...")
        self.extract_audio_from_video()
        
        frame_count = 0
        last_speech_update = 0
        current_speech = "Processing speech..."
        speech_update_interval = int(fps * 3)  # Update speech every 3 seconds
        
        print(f"Processing video with {total_frames} frames at {fps} FPS")
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            # Process only every Nth frame to speed up analysis
            if frame_count % frame_skip != 0:
                frame_count += 1
                continue
                
            # Convert BGR to RGB for MediaPipe
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            
            # Store current timestamp for overlay
            self.current_timestamp = frame_count / fps
            
            # Process pose
            pose_results = self.pose.process(frame_rgb)
            annotated_frame = self.draw_pose(frame.copy(), pose_results)
            
            # Store pose data for this frame
            if pose_results.pose_landmarks:
                frame_pose_data = {
                    'frame': frame_count,
                    'timestamp': frame_count / fps,
                    'landmarks': [[lm.x, lm.y, lm.z, lm.visibility] for lm in pose_results.pose_landmarks.landmark]
                }
                self.pose_data.append(frame_pose_data)
            
            # Update speech text periodically
            if frame_count - last_speech_update >= speech_update_interval:
                timestamp = frame_count / fps
                current_speech = self.get_speech_at_timestamp(timestamp)
                last_speech_update = frame_count
                
                # Analyze context from speech text if available
                if current_speech and len(current_speech) > 20:
                    self.analyze_context(current_speech, timestamp)
            
            # Add speech transcription and context to the frame
            self.add_text_overlay(annotated_frame, current_speech)
            
            # Write the frame to output video
            out.write(annotated_frame)
            
            frame_count += 1
            if frame_count % 100 == 0:
                print(f"Processed {frame_count}/{total_frames} frames ({frame_count/total_frames*100:.1f}%)")
        
        # Release resources
        cap.release()
        out.release()
        self.output_video = output_path
        print(f"Analysis complete. Output video saved to {output_path}")
        return True
        
    def draw_pose(self, frame, pose_results):
        """Draw pose landmarks on the frame with improved visibility."""
        annotated_frame = frame.copy()
        
        # Draw segmentation mask if available (helps isolate people)
        if hasattr(pose_results, 'segmentation_mask') and pose_results.segmentation_mask is not None:
            segmentation_mask = pose_results.segmentation_mask
            condition = np.stack((segmentation_mask,) * 3, axis=-1) > 0.1
            bg_image = np.zeros(frame.shape, dtype=np.uint8)
            bg_image[:] = (192, 192, 192)  # Light gray background
            annotated_frame = np.where(condition, annotated_frame, bg_image)
        
        if pose_results.pose_landmarks:
            # Draw pose landmarks with improved style
            self.mp_drawing.draw_landmarks(
                annotated_frame,
                pose_results.pose_landmarks,
                self.mp_pose.POSE_CONNECTIONS,
                landmark_drawing_spec=self.mp_drawing_styles.get_default_pose_landmarks_style()
            )
            
            # Draw enhanced skeleton connections for better visibility
            for i, connection in enumerate(self.mp_pose.POSE_CONNECTIONS):
                start_idx = connection[0]
                end_idx = connection[1]
                
                # Only draw if both landmarks are visible enough
                if (pose_results.pose_landmarks.landmark[start_idx].visibility > 0.5 and
                    pose_results.pose_landmarks.landmark[end_idx].visibility > 0.5):
                    
                    start_point = tuple(np.multiply(
                        [pose_results.pose_landmarks.landmark[start_idx].x, 
                         pose_results.pose_landmarks.landmark[start_idx].y],
                        [frame.shape[1], frame.shape[0]]).astype(int))
                    end_point = tuple(np.multiply(
                        [pose_results.pose_landmarks.landmark[end_idx].x, 
                         pose_results.pose_landmarks.landmark[end_idx].y],
                        [frame.shape[1], frame.shape[0]]).astype(int))
                    
                    # Use different colors for different body parts
                    color = (0, 255, 255)  # Default yellow
                    
                    # Color-code different body parts
                    # Arms - blue
                    if (11 <= start_idx <= 16) or (11 <= end_idx <= 16) or (23 <= start_idx <= 28) or (23 <= end_idx <= 28):
                        color = (255, 128, 0)  # Blue-ish
                    # Legs - green
                    elif (23 <= start_idx <= 32) or (23 <= end_idx <= 32):
                        color = (0, 255, 0)  # Green
                    # Face - purple
                    elif (0 <= start_idx <= 10) or (0 <= end_idx <= 10):
                        color = (255, 0, 255)  # Purple
                    # Torso - red
                    elif (11 <= start_idx <= 24) or (11 <= end_idx <= 24):
                        color = (0, 0, 255)  # Red
                        
                    cv2.line(annotated_frame, start_point, end_point, color, 3)
                    
            # Add dots at key points with labels for important landmarks
            important_landmarks = {
                0: "Nose",
                11: "L Shoulder",
                12: "R Shoulder",
                23: "L Hip",
                24: "R Hip",
                15: "L Wrist",
                16: "R Wrist",
                27: "L Ankle",
                28: "R Ankle"
            }
            
            for idx, name in important_landmarks.items():
                if pose_results.pose_landmarks.landmark[idx].visibility > 0.7:
                    pos = tuple(np.multiply(
                        [pose_results.pose_landmarks.landmark[idx].x, 
                         pose_results.pose_landmarks.landmark[idx].y],
                        [frame.shape[1], frame.shape[0]]).astype(int))
                    
                    # Draw a more visible circle
                    cv2.circle(annotated_frame, pos, 5, (255, 255, 255), -1)
                    cv2.circle(annotated_frame, pos, 5, (0, 0, 0), 1)
                    
                    # Only add labels for key points to avoid cluttering
                    if idx in [0, 11, 12, 15, 16]:
                        cv2.putText(annotated_frame, name, 
                                   (pos[0]+10, pos[1]), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2, cv2.LINE_AA)
                        cv2.putText(annotated_frame, name, 
                                   (pos[0]+10, pos[1]), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)
        
        return annotated_frame
    
    def extract_audio_from_video(self):
        """Extract audio from video file for speech recognition."""
        print("Transcribing speech from video...")
        try:
            result = self.speech_model.transcribe(self.video_path)
            
            # Store speech segments with timestamps
            for segment in result["segments"]:
                self.speech_segments.append({
                    "start": segment["start"],
                    "end": segment["end"],
                    "text": segment["text"]
                })
            
            print(f"Speech transcription complete. Found {len(self.speech_segments)} segments.")
        except Exception as e:
            print(f"Error during speech transcription: {e}")
            # Add a dummy segment to avoid errors
            self.speech_segments.append({
                "start": 0,
                "end": 100000,  # Very large end time
                "text": "Speech transcription failed. Processing video without speech analysis."
            })
    
    def get_speech_at_timestamp(self, timestamp):
        """Get the speech text at a specific timestamp."""
        for segment in self.speech_segments:
            if segment["start"] <= timestamp <= segment["end"]:
                return segment["text"]
        return ""
    
    def analyze_context(self, text, timestamp):
        """Analyze the context of speech text using NLP."""
        try:
            # Define potential topics that might be discussed in CSPAN videos
            potential_topics = [
                "policy", "legislation", "economy", "healthcare", 
                "foreign affairs", "national security", "election",
                "budget", "infrastructure", "education", "immigration"
            ]
            
            # Classify the text into potential topics
            topic_result = self.topic_classifier(text, potential_topics)
            
            # Get a short summary if text is long enough
            summary = ""
            if len(text) > 100:
                try:
                    summary = self.nlp(text, max_length=60, min_length=20, do_sample=False)[0]['summary_text']
                except Exception as e:
                    print(f"Error generating summary: {e}")
                    summary = text[:100] + "..."
            
            context = {
                "timestamp": timestamp,
                "text": text,
                "topics": topic_result,
                "summary": summary
            }
            
            self.context_data.append(context)
            return context
        except Exception as e:
            print(f"Error analyzing context: {e}")
            return {
                "timestamp": timestamp,
                "text": text,
                "topics": {"labels": ["unknown"], "scores": [1.0]},
                "summary": ""
            }
    
    def add_text_overlay(self, frame, text):
        """Add enhanced text overlay to the frame."""
        # Add semi-transparent background for text
        overlay = frame.copy()
        cv2.rectangle(overlay, (0, frame.shape[0]-180), (frame.shape[1], frame.shape[0]), (0, 0, 0), -1)
        alpha = 0.8  # More opaque for better readability
        cv2.addWeighted(overlay, alpha, frame, 1-alpha, 0, frame)
        
        # Add speech text with better formatting
        font = cv2.FONT_HERSHEY_SIMPLEX
        if text:
            # Split text into multiple lines
            max_width = 80
            words = text.split()
            lines = []
            current_line = ""
            
            for word in words:
                if len(current_line + " " + word) <= max_width:
                    current_line += " " + word if current_line else word
                else:
                    lines.append(current_line)
                    current_line = word
            
            if current_line:
                lines.append(current_line)
            
            # Draw text background for better readability
            for i, line in enumerate(lines):
                y_pos = frame.shape[0] - 150 + (i * 30)
                # Draw each line with shadow effect for better readability
                cv2.putText(frame, line, (22, y_pos+2), font, 0.7, (0, 0, 0), 2, cv2.LINE_AA)  # Shadow
                cv2.putText(frame, line, (20, y_pos), font, 0.7, (255, 255, 255), 2, cv2.LINE_AA)  # Text
        
        # Add title with better styling
        title_bg = frame.copy()
        cv2.rectangle(title_bg, (0, 0), (frame.shape[1], 60), (0, 0, 0), -1)
        cv2.addWeighted(title_bg, 0.7, frame, 0.3, 0, frame)
        
        # Add main title
        cv2.putText(frame, "CSPAN Video Analysis", (20, 40), font, 1.2, (0, 0, 0), 3, cv2.LINE_AA)  # Shadow
        cv2.putText(frame, "CSPAN Video Analysis", (20, 40), font, 1.2, (0, 255, 255), 2, cv2.LINE_AA)  # Text
        
        # Add ML analysis label with better positioning
        analysis_text = "Multi-Person Pose Tracking + Speech Analysis"
        text_size = cv2.getTextSize(analysis_text, font, 0.7, 2)[0]
        cv2.putText(frame, analysis_text, (frame.shape[1]-text_size[0]-20, 40), 
                   font, 0.7, (0, 0, 0), 3, cv2.LINE_AA)  # Shadow
        cv2.putText(frame, analysis_text, (frame.shape[1]-text_size[0]-20, 40), 
                   font, 0.7, (0, 255, 255), 2, cv2.LINE_AA)  # Text
        
        # Add timestamp if available
        if hasattr(self, 'current_timestamp') and self.current_timestamp is not None:
            timestamp_str = f"Time: {self.format_timestamp(self.current_timestamp)}"
            cv2.putText(frame, timestamp_str, (frame.shape[1]-200, 80), 
                       font, 0.6, (200, 200, 200), 2, cv2.LINE_AA)
        
        return frame
        
    def format_timestamp(self, seconds):
        """Format seconds into MM:SS format."""
        minutes = int(seconds // 60)
        seconds = int(seconds % 60)
        return f"{minutes:02d}:{seconds:02d}"
    
    def generate_analytics(self):
        """Generate analytics from collected data."""
        if not self.pose_data or not self.speech_segments:
            print("No data available for analytics")
            return
            
        print("Generating analytics...")
        
        # Simple analysis of pose movement
        movement_analysis = self.analyze_movement()
        
        # Speech pattern analysis
        speech_analysis = self.analyze_speech()
        
        # Print summary
        print("\n=== CSPAN Video Analysis Summary ===")
        print(f"Video duration: {self.pose_data[-1]['timestamp']:.2f} seconds" if self.pose_data else "No pose data available")
        print(f"Frames analyzed: {len(self.pose_data)}")
        print(f"Speech segments: {len(self.speech_segments)}")
        print(f"Movement analysis: {movement_analysis}")
        print(f"Speech analysis: {speech_analysis}")
        
    def analyze_movement(self):
        """Analyze the pose movement data."""
        if not self.pose_data:
            return {}
            
        # Extract movement of key points (e.g., hands)
        right_hand_idx = self.mp_pose.PoseLandmark.RIGHT_WRIST.value
        left_hand_idx = self.mp_pose.PoseLandmark.LEFT_WRIST.value
        head_idx = self.mp_pose.PoseLandmark.NOSE.value
        
        right_hand_movement = []
        left_hand_movement = []
        head_movement = []
        
        for frame_data in self.pose_data:
            if len(frame_data['landmarks']) > right_hand_idx:
                right_hand_movement.append(frame_data['landmarks'][right_hand_idx][:2])  # x, y
            if len(frame_data['landmarks']) > left_hand_idx:
                left_hand_movement.append(frame_data['landmarks'][left_hand_idx][:2])
            if len(frame_data['landmarks']) > head_idx:
                head_movement.append(frame_data['landmarks'][head_idx][:2])
        
        # Calculate movement variance
        movement_analysis = {}
        if right_hand_movement:
            right_hand_array = np.array(right_hand_movement)
            movement_analysis['right_hand_variance'] = np.sum(np.var(right_hand_array, axis=0))
        if left_hand_movement:
            left_hand_array = np.array(left_hand_movement)
            movement_analysis['left_hand_variance'] = np.sum(np.var(left_hand_array, axis=0))
        if head_movement:
            head_array = np.array(head_movement)
            movement_analysis['head_variance'] = np.sum(np.var(head_array, axis=0))
        
        return movement_analysis
    
    def analyze_speech(self):
        """Analyze speech patterns."""
        if not self.speech_segments:
            return {}
            
        total_words = sum(len(segment['text'].split()) for segment in self.speech_segments)
        total_duration = sum(segment['end'] - segment['start'] for segment in self.speech_segments)
        
        speech_analysis = {
            "total_segments": len(self.speech_segments),
            "total_words": total_words,
            "total_speech_duration": total_duration,
            "words_per_minute": (total_words / total_duration) * 60 if total_duration > 0 else 0
        }
        
        return speech_analysis


# Example usage
if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='CSPAN Video Analyzer')
    parser.add_argument('--video', type=str, help='Path to local video file')
    parser.add_argument('--url', type=str, help='YouTube URL of CSPAN video')
    parser.add_argument('--output', type=str, default="cspan_analyzed.mp4", help='Output video path')
    parser.add_argument('--frame-skip', type=int, default=2, help='Process every Nth frame (higher values = faster processing)')
    
    args = parser.parse_args()
    
    if not args.video and not args.url:
        print("Error: Either --video or --url must be provided")
        parser.print_help()
        exit(1)
    
    # Initialize analyzer with provided video path or URL
    analyzer = CSPANAnalyzer(video_path=args.video, url=args.url)
    
    # Process the video
    analyzer.process_video(output_path=args.output, frame_skip=args.frame_skip)
    
    # Generate analytics
    analyzer.generate_analytics()

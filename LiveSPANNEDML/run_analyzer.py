#!/usr/bin/env python3
"""
Simple script to run the CSPAN Analyzer on a sample video
"""

import os
from cspan_analyzer_working import CSPANAnalyzer

# Path to the local video file
VIDEO_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "President Trump Signs Executive Orders Supporting Coal Industry.mp4")

def main():
    print("Starting CSPAN Video Analysis...")
    
    # Check if the video file exists
    if not os.path.exists(VIDEO_PATH):
        print(f"Error: Video file not found at {VIDEO_PATH}")
        print("Please download a CSPAN video and save it as 'cspan_video.mp4' in this directory.")
        return
    
    # Initialize the analyzer with the local video path
    analyzer = CSPANAnalyzer(video_path=VIDEO_PATH)
    
    # Process the video with a higher frame skip for faster processing
    # Adjust frame_skip as needed (higher = faster but less smooth)
    analyzer.process_video(output_path="cspan_analyzed_output.mp4", frame_skip=3)
    
    # Generate analytics about the video
    analyzer.generate_analytics()
    
    print("\nAnalysis complete! Check the output video: cspan_analyzed_output.mp4")

if __name__ == "__main__":
    main()

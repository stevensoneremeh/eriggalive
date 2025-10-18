-- Seed sample videos for the streaming platform
INSERT INTO public.videos (title, description, thumbnail_url, video_url, duration_seconds, view_count) VALUES
  (
    'Beautiful Sunset Over Mountains',
    'A breathtaking 4K video of a golden sunset over snow-capped mountains with ambient music.',
    '/placeholder.svg?height=400&width=600',
    'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.mp4',
    245,
    1250
  ),
  (
    'Ocean Waves Meditation',
    'Relaxing waves crashing on a pristine beach. Perfect for meditation and relaxation.',
    '/placeholder.svg?height=400&width=600',
    'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ElephantsDream.mp4',
    180,
    3420
  ),
  (
    'Northern Lights Aurora',
    'Stunning timelapse of the Northern Lights dancing across the Arctic sky.',
    '/placeholder.svg?height=400&width=600',
    'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerBlazes.mp4',
    320,
    5680
  ),
  (
    'Forest Rain Ambience',
    'Immersive rainforest sounds with gentle rainfall. Great for focus and sleep.',
    '/placeholder.svg?height=400&width=600',
    'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerEscapes.mp4',
    600,
    2340
  ),
  (
    'City Lights at Night',
    'Mesmerizing timelapse of a bustling city transforming from day to night.',
    '/placeholder.svg?height=400&width=600',
    'https://commondatastorage.googleapis.com/gtv-videos-library/sample/ForBiggerJoyrides.mp4',
    210,
    4120
  ),
  (
    'Underwater Coral Reef',
    'Explore the vibrant colors and life of a tropical coral reef ecosystem.',
    '/placeholder.svg?height=400&width=600',
    'https://commondatastorage.googleapis.com/gtv-videos-library/sample/Sintel.mp4',
    290,
    2890
  );

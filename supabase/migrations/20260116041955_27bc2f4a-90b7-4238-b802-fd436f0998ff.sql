-- Configure marketing-media bucket with file size limit and allowed mime types
UPDATE storage.buckets 
SET 
  file_size_limit = 52428800, -- 50MB
  allowed_mime_types = ARRAY[
    'image/png', 
    'image/jpeg', 
    'image/webp', 
    'image/gif', 
    'video/mp4', 
    'video/webm', 
    'video/quicktime', 
    'audio/mpeg', 
    'audio/wav', 
    'audio/ogg', 
    'audio/webm'
  ]
WHERE name = 'marketing-media';
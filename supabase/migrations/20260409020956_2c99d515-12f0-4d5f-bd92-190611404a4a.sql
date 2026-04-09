UPDATE public.demo_videos 
SET title = REPLACE(title, 'Album Plus', 'Alplum Plus') 
WHERE title ILIKE '%Album Plus%';
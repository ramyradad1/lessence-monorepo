-- Migration: 20260226070000_fix_reviews_profiles_fkey.sql
-- Add explicit foreign key relationship between reviews and profiles
-- to allow PostgREST to join the two tables in the Admin Reviews page.

ALTER TABLE public.reviews
ADD CONSTRAINT reviews_profiles_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;

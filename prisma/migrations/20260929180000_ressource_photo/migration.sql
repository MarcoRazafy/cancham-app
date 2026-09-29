-- Une photo peut être une ressource à part entière, au même titre qu'un
-- document ou une vidéo. Elle se lit comme un document d'une seule page.
ALTER TYPE "ResourceFormat" ADD VALUE IF NOT EXISTS 'Photo';

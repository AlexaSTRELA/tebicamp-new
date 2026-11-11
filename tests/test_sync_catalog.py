import importlib.util
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('sync_catalog', Path(__file__).resolve().parents[1] / 'scripts/sync_catalog.py')
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)
PHOTO = b'\xff\xd8\xffvalid-test-photo\xff\xd9'

class PhotoMirrorTests(unittest.TestCase):
    def test_photos_uploaded_before_name_and_year_are_published(self):
        url = sync.BASE + sync.STORAGE_PREFIX + 'caravan-null/photo.jpg'
        slug = 'pritsep-dacha-hobby-premium-560-cfe-2015'
        with tempfile.TemporaryDirectory() as root, patch.object(sync, 'ROOT', Path(root)), patch.object(sync, 'request_bytes', return_value=PHOTO) as fetch:
            result = sync.mirror_photo(url, slug, {})
            self.assertEqual(result, 'assets/catalog/' + slug + '/photo.jpg')
            self.assertEqual((Path(root) / result).read_bytes(), PHOTO)
            fetch.assert_called_once_with(url)

    def test_matching_folder_still_works_and_cache_avoids_downloads(self):
        url = sync.BASE + sync.STORAGE_PREFIX + 'hobby-2015/photo.jpg'
        with tempfile.TemporaryDirectory() as root, patch.object(sync, 'ROOT', Path(root)), patch.object(sync, 'request_bytes', return_value=PHOTO) as fetch:
            cache = {}
            first = sync.mirror_photo(url, 'hobby-2015', cache)
            self.assertEqual(first, sync.mirror_photo(url, 'hobby-2015', cache))
            self.assertEqual(first, sync.mirror_photo(url, 'hobby-2015', {}))
            self.assertEqual(fetch.call_count, 1)

    def test_invalid_storage_paths_are_rejected_before_fetch(self):
        for path in ['../photo.jpg', '%2e%2e/photo.jpg', 'nested/folder/photo.jpg', 'bad_folder/photo.jpg', 'caravan-null/file.exe']:
            with self.subTest(path=path), patch.object(sync, 'request_bytes') as fetch:
                with self.assertRaises(RuntimeError):
                    sync.mirror_photo(sync.BASE + sync.STORAGE_PREFIX + path, 'hobby-2015', {})
                fetch.assert_not_called()

    def test_corrupt_photo_does_not_publish_a_broken_file(self):
        with tempfile.TemporaryDirectory() as root, patch.object(sync, 'ROOT', Path(root)), patch.object(sync, 'request_bytes', return_value=b'partial-photo'):
            with self.assertRaises(RuntimeError):
                sync.mirror_photo(sync.BASE + sync.STORAGE_PREFIX + 'caravan-null/photo.jpg', 'hobby-2015', {})
            self.assertFalse((Path(root) / 'assets/catalog/hobby-2015/photo.jpg').exists())

if __name__ == '__main__':
    unittest.main()

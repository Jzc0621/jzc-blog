"""One-shot: fix existing posts whose slug contains non-ASCII characters."""
import re, hashlib
from app import app
from extensions import db
from models import Post


def fix_slugs():
    with app.app_context():
        posts = Post.query.all()
        fixed = 0
        for post in posts:
            if post.slug.isascii():
                continue
            new_slug = re.sub(r"[^\w\-]", "", post.title.lower().replace(" ", "-"))
            if not new_slug or not new_slug.isascii():
                new_slug = "post-" + hashlib.md5(post.title.encode()).hexdigest()[:8]
            old_slug = post.slug
            post.slug = new_slug
            fixed += 1
            print(f"  {old_slug} -> {new_slug}")
        if fixed:
            db.session.commit()
            print(f"\nFixed {fixed} post(s).")
        else:
            print("No posts with non-ASCII slugs found.")


if __name__ == "__main__":
    fix_slugs()

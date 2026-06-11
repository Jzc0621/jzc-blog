"""One-time migration: import existing posts/*.md and notes/*.md into the database."""
import re, sys
from datetime import datetime
from pathlib import Path

from app import app
from extensions import db
from models import Post

import frontmatter


def import_dir(directory: Path, is_post: bool):
    """Import all .md files from directory into database."""
    count = 0
    for f in sorted(directory.glob("*.md")):
        try:
            meta = frontmatter.load(f)
        except Exception:
            print(f"  SKIP {f.name}: parse error")
            continue

        slug = f.stem
        title = meta.get("title", slug)
        date_str = meta.get("date", "")
        tag = meta.get("tag", "未分类")
        excerpt = meta.get("excerpt", "")
        content = meta.content

        # Parse date from frontmatter
        dt = None
        for fmt in ("%Y-%m-%d", "%Y-%m-%d %H:%M"):
            try:
                dt = datetime.strptime(str(date_str), fmt)
                break
            except ValueError:
                continue

        existing = Post.query.filter_by(slug=slug).first()
        if existing:
            print(f"  SKIP {f.name}: slug '{slug}' already exists")
            continue

        post = Post(
            slug=slug, title=title, content=content,
            excerpt=excerpt[:500], tag=tag, is_post=is_post,
            status="published",
        )
        if dt:
            post.created_at = dt
            post.updated_at = dt
        db.session.add(post)
        count += 1
        print(f"  OK {f.name} -> slug='{slug}'")

    return count


def main():
    with app.app_context():
        db.create_all()

        print("Importing posts...")
        n_posts = import_dir(Path(__file__).parent / "posts", is_post=True)

        print("\nImporting notes...")
        n_notes = import_dir(Path(__file__).parent / "notes", is_post=False)

        db.session.commit()
        print(f"\nDone! {n_posts} posts + {n_notes} notes imported.")


if __name__ == "__main__":
    main()

"""
Create submission zip archive G01_HostelLaundryManagement_Submission.zip
Excluding node_modules, .git, and __pycache__
Verifying that .docx and .pdf reports exist and are non-empty.
"""
import os
import zipfile

def create_zip():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    zip_path = os.path.join(root_dir, "G01_HostelLaundryManagement_Submission.zip")

    # Verify that both .docx and .pdf reports exist and are non-empty
    docx_root = os.path.join(root_dir, "G01_HostelLaundryManagement_Report.docx")
    pdf_root = os.path.join(root_dir, "G01_HostelLaundryManagement_Report.pdf")
    docx_docs = os.path.join(root_dir, "docs", "G01_HostelLaundryManagement_Report.docx")
    pdf_docs = os.path.join(root_dir, "docs", "G01_HostelLaundryManagement_Report.pdf")

    for path, name in [(docx_root, "Root DOCX"), (pdf_root, "Root PDF"), (docx_docs, "Docs DOCX"), (pdf_docs, "Docs PDF")]:
        if not os.path.exists(path):
            raise FileNotFoundError(f"Required report artifact missing: {name} at {path}")
        size = os.path.getsize(path)
        if size < 500000:
            raise ValueError(f"Report artifact {name} is unusually small ({size} bytes). Verification failed.")
        print(f"Verified {name}: {path} ({size:,} bytes)")

    if os.path.exists(zip_path):
        os.remove(zip_path)

    exclude_dirs = {"node_modules", ".git", "__pycache__", ".system_generated"}
    exclude_files = {
        "G01_HostelLaundryManagement_Submission.zip",
        "test_out.docx",
        "test_page_no.docx",
        "test_docx_features.py",
        "temp_layout_measure.docx"
    }

    total_files = 0
    total_uncompressed_bytes = 0

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(root_dir):
            # Prune excluded directories in-place
            dirs[:] = [d for d in dirs if d not in exclude_dirs]

            for file in files:
                if file in exclude_files or file.endswith('.pyc') or file.endswith('.pyo'):
                    continue
                
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, root_dir)
                
                # Check path doesn't contain excluded directory names
                parts = rel_path.split(os.sep)
                if any(p in exclude_dirs for p in parts):
                    continue

                zipf.write(full_path, rel_path)
                total_files += 1
                total_uncompressed_bytes += os.path.getsize(full_path)

    zip_size = os.path.getsize(zip_path)
    print(f"\nSubmission ZIP created successfully!")
    print(f"Path: {zip_path}")
    print(f"Total files: {total_files}")
    print(f"Uncompressed size: {total_uncompressed_bytes / (1024*1024):.2f} MB")
    print(f"Compressed ZIP size: {zip_size / (1024*1024):.2f} MB")

    # Verify no excluded items in ZIP
    with zipfile.ZipFile(zip_path, 'r') as z:
        for name in z.namelist():
            for p in name.split('/'):
                if p in exclude_dirs:
                    raise ValueError(f"Excluded directory item leaked into zip: {name}")

    print("All verification checks PASSED cleanly!")

if __name__ == "__main__":
    create_zip()

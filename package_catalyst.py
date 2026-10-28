import zipfile
import os

def create_zips():
    # 1. Catalyst Web Client Hosting ZIP (contains contents of dist directly at root)
    webclient_zip = 'catalyst-webclient-deploy.zip'
    with zipfile.ZipFile(webclient_zip, 'w', zipfile.ZIP_DEFLATED) as z:
        for root, _, files in os.walk('dist'):
            for f in files:
                abs_path = os.path.join(root, f)
                rel_path = os.path.relpath(abs_path, 'dist')
                z.write(abs_path, rel_path)
    print(f"Created {webclient_zip} ({os.path.getsize(webclient_zip):,} bytes)")

    # 2. Catalyst AppSail Full-Stack Deployment ZIP
    appsail_zip = 'catalyst-appsail-deploy.zip'
    with zipfile.ZipFile(appsail_zip, 'w', zipfile.ZIP_DEFLATED) as z:
        core_files = [
            'server.js',
            'package.json',
            'app-config.json',
            'catalyst.json',
            'quickml_config.json',
            'predict.py',
            'demand_forecast_model.joblib',
            '.env.example'
        ]
        for f in core_files:
            if os.path.exists(f):
                z.write(f, f)
        for root, _, files in os.walk('dist'):
            for f in files:
                abs_path = os.path.join(root, f)
                z.write(abs_path, abs_path)
    print(f"Created {appsail_zip} ({os.path.getsize(appsail_zip):,} bytes)")

if __name__ == '__main__':
    create_zips()


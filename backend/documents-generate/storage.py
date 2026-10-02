import os


def save_file(key: str, data: bytes, content_type: str) -> str:
    '''Сохраняет файл в выбранное хранилище (STORAGE_BACKEND: poehali | local) и возвращает ссылку на него'''
    backend = os.environ.get('STORAGE_BACKEND', 'poehali')

    if backend == 'local':
        base_dir = os.environ.get('STORAGE_DIR', '/data/files')
        full_path = os.path.realpath(os.path.join(base_dir, key))
        if not full_path.startswith(os.path.realpath(base_dir) + os.sep):
            raise ValueError('Недопустимый путь файла')
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'wb') as f:
            f.write(data)
        prefix = os.environ.get('FILES_URL_PREFIX', '/api/files').rstrip('/')
        return f"{prefix}/{key}"

    import boto3
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType=content_type)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

import boto3
from botocore.config import Config

from app.core.config import settings

_bedrock_runtime_client = None
_bedrock_control_plane_client = None


def get_bedrock_runtime_client():
    global _bedrock_runtime_client
    if _bedrock_runtime_client is None:
        session = boto3.Session(
            region_name=settings.aws_region,
            profile_name=settings.aws_profile,
        )
        _bedrock_runtime_client = session.client(
            "bedrock-runtime",
            config=Config(
                region_name=settings.aws_region,
                retries={"mode": "adaptive", "max_attempts": 6},
                read_timeout=120,
                connect_timeout=10,
            ),
        )
    return _bedrock_runtime_client


def get_bedrock_control_plane_client():
    global _bedrock_control_plane_client
    if _bedrock_control_plane_client is None:
        session = boto3.Session(
            region_name=settings.aws_region,
            profile_name=settings.aws_profile,
        )
        _bedrock_control_plane_client = session.client(
            "bedrock",
            config=Config(
                region_name=settings.aws_region,
                retries={"mode": "adaptive", "max_attempts": 3},
            ),
        )
    return _bedrock_control_plane_client


def check_bedrock_access():
    try:
        client = get_bedrock_control_plane_client()
        identity = boto3.client("sts").get_caller_identity()
        print(f"✓ AWS Identity: {identity['Arn']}")

        models = [
            settings.bedrock_model_opus,
            settings.bedrock_model_sonnet,
            settings.bedrock_model_haiku,
        ]
        for model_id in models:
            try:
                runtime = get_bedrock_runtime_client()
                response = runtime.converse(
                    modelId=model_id,
                    messages=[
                        {
                            "role": "user",
                            "content": [{"text": "Hello, acknowledge you are working."}],
                        }
                    ],
                )
                print(f"✓ Model {model_id}: OK")
            except Exception as e:
                print(f"✗ Model {model_id}: {e}")

    except Exception as e:
        print(f"✗ Bedrock access check failed: {e}")
        raise

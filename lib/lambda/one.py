import boto3
import os
import uuid
import boto3

from aws_lambda_powertools import Tracer
from aws_lambda_powertools import Logger
from aws_lambda_powertools.utilities.typing import LambdaContext

logs = boto3.client('logs')
sqs = boto3.client('sqs')
tracer = Tracer()
logger = Logger()


QUEUE_URL = os.getenv("DEST_QUEUE_URL")

@tracer.capture_method
def process_messages(event):
    if event:
        batch_item_failures = []
        sqs_batch_response = {}
    
        for record in event["Records"]:
            try:
                logger.info(record)
                response = sqs.send_message(
                    QueueUrl=QUEUE_URL,
                    DelaySeconds=10,
                    MessageBody=record["body"]
                )
                logger.info("### Writing Record to QueueTwo")
                logger.info(response)
            except Exception as e:
                logger.exception("Received Exception")
                batch_item_failures.append({"itemIdentifier": record['messageId']})
        
        sqs_batch_response["batchItemFailures"] = batch_item_failures
        return sqs_batch_response

@logger.inject_lambda_context()
@tracer.capture_lambda_handler()
def lambda_handler(event, context):
    UNIQUE_REQUEST_ID = str(uuid.uuid4())
    logger.set_correlation_id(UNIQUE_REQUEST_ID)

    logger.info("### Starting Lambda Function One")
    logger.info("### Records in Event:")
    sqs_batch_response = process_messages(event)
    logger.info("### Finished Processing Event in Lambda Function One")

    return sqs_batch_response
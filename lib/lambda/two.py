import boto3
from aws_lambda_powertools import Tracer
from aws_lambda_powertools import Logger
from aws_lambda_powertools.utilities.typing import LambdaContext

tracer = Tracer()
logger = Logger()

@tracer.capture_method
def process_messages(event):
    if event:
        batch_item_failures = []
        sqs_batch_response = {}
    
        for record in event["Records"]:
            try:
                logger.info(record)
            except Exception as e:
                batch_item_failures.append({"itemIdentifier": record['messageId']})
        
        sqs_batch_response["batchItemFailures"] = batch_item_failures
        return sqs_batch_response

@logger.inject_lambda_context()
@tracer.capture_lambda_handler()
def lambda_handler(event, context):
    logger.info("### Starting Lambda Function Two")
    logger.info("### Records in Event:")
    sqs_batch_response = process_messages(event)
    logger.info("### Finished Processing Event in Lambda Function Two")

    return sqs_batch_response
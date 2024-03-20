# About the Demo
The Demo deploys a "distributed" serverless applications, that is made of two dummy Services/Functions, which are integrated by Amazon SQS.
[](./ServiceMap.png)

## How to run the demo

### Deploy the CDK App
- `cdk bootstrap`
- `cdk deploy`

### Send message
Send some messages to the API Gateway Endpoint and review the traces in the CloudWatch Console

```
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"message":"Hello World"}' \
  https://{YOUR_API_GATEWAY_ENDPOINT}/dev/
```


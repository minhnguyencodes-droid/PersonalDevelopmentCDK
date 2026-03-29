# PersonalDevelopmentCDK

CDK project to deploy a personal EC2 dev desktop (Ubuntu 24.04, t3.xlarge, 100GB GP3 SSD) with idle auto-shutdown.

## Prerequisites

- Node.js 18+
- AWS CLI configured with credentials (`aws configure`)
- An AWS account with a default VPC

## Setup

```bash
npm install
```

## First-time only — bootstrap CDK in your account

```bash
npx cdk bootstrap
```

## AWS Credentials

If you have a named profile for your personal account:

```bash
export AWS_PROFILE=my-personal-profile
```

Or set account and region explicitly for this session:

```bash
export CDK_DEFAULT_ACCOUNT=123456789012
export CDK_DEFAULT_REGION=ap-southeast-2
```

## Deploy

```bash
npx cdk deploy
```

## Connect

```bash
aws ssm start-session --target <instance-id>
```

The instance ID is printed as a stack output after deploy.

## Configuration

Edit `bin/app.ts` to customize:

```typescript
new DevDesktopStack(app, "DevDesktopStack", {
  instanceType: "t3.xlarge",    // instance size
  volumeSizeGb: 100,            // EBS volume size
  allowSshFrom: ["1.2.3.4/32"],// SSH access CIDRs (optional, SSM works without this)
  idleStopMinutes: 30,          // auto-stop after idle
});
```

## Re-run install script

SSH/SSM into the instance and run:

```bash
sudo bash /var/lib/cloud/instance/scripts/part-001
```

Or update `scripts/install.sh` locally, push to your repo, pull on the instance, and run it.

## Destroy

```bash
npx cdk destroy
```

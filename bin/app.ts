#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { DevDesktopStack } from "../lib/dev-desktop-stack";

const app = new cdk.App();

new DevDesktopStack(app, "DevDesktopStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  allowSshFrom: ["1.41.116.89/32"],
});

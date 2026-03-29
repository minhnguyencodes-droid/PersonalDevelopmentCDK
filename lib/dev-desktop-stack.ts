import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";
import * as fs from "fs";
import * as path from "path";

export interface DevDesktopProps extends cdk.StackProps {
  instanceType?: string;
  volumeSizeGb?: number;
  allowSshFrom?: string[];
}

const SCRIPTS_DIR = path.join(__dirname, "..", "scripts");

const readScript = (filePath: string) =>
  fs.readFileSync(path.join(SCRIPTS_DIR, filePath), "utf-8").trimEnd();

const buildUserData = (): ec2.UserData => {
  const rendered = readScript("user-data.sh")
    .replace("{{TMUX_CONF}}", readScript("config/.tmux.conf"))
    .replace("{{ZSHRC}}", readScript("config/.zshrc"));

  const userData = ec2.UserData.forLinux();
  userData.addCommands(rendered);
  return userData;
};

export class DevDesktopStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: DevDesktopProps) {
    super(scope, id, props);

    const instanceType = props?.instanceType ?? "t3.xlarge";
    const volumeSizeGb = props?.volumeSizeGb ?? 100;
    const allowSshFrom = props?.allowSshFrom ?? [];

    const vpc = ec2.Vpc.fromLookup(this, "DefaultVpc", { isDefault: true });

    const sg = new ec2.SecurityGroup(this, "DevDesktopSG", {
      vpc,
      description: "Dev desktop security group",
      allowAllOutbound: true,
    });
    for (const cidr of allowSshFrom) {
      sg.addIngressRule(ec2.Peer.ipv4(cidr), ec2.Port.tcp(22), `SSH from ${cidr}`);
    }

    const role = new iam.Role(this, "DevDesktopRole", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
      ],
    });

    const ami = ec2.MachineImage.lookup({
      name: "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*",
      owners: ["099720109477"],
    });

    const keyPair = new ec2.KeyPair(this, "DevDesktopKey", {
      keyPairName: "dev-desktop-key",
    });

    const instance = new ec2.Instance(this, "DevDesktop", {
      keyPair,
      vpc,
      instanceType: new ec2.InstanceType(instanceType),
      machineImage: ami,
      securityGroup: sg,
      role,
      userData: buildUserData(),
      blockDevices: [
        {
          deviceName: "/dev/sda1",
          volume: ec2.BlockDeviceVolume.ebs(volumeSizeGb, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
          }),
        },
      ],
      userDataCausesReplacement: true,
    });

    new cdk.CfnOutput(this, "InstanceId", { value: instance.instanceId });
    new cdk.CfnOutput(this, "PublicIP", { value: instance.instancePublicIp });
    new cdk.CfnOutput(this, "SSMConnect", {
      value: `aws ssm start-session --target ${instance.instanceId}`,
    });
    new cdk.CfnOutput(this, "SSHConnect", {
      value: `ssh -i ~/.ssh/dev-desktop.pem ubuntu@${instance.instancePublicIp}`,
    });
    new cdk.CfnOutput(this, "GetSSHKey", {
      value: `aws ssm get-parameter --name /ec2/keypair/${keyPair.keyPairId} --with-decryption --query Parameter.Value --output text > ~/.ssh/dev-desktop.pem && chmod 400 ~/.ssh/dev-desktop.pem`,
    });
  }
}

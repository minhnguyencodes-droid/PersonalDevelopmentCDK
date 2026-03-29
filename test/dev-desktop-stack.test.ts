import * as cdk from "aws-cdk-lib";
import { Template, Match } from "aws-cdk-lib/assertions";
import { DevDesktopStack } from "../lib/dev-desktop-stack";

const synthStack = (props?: Record<string, unknown>): Template => {
  const app = new cdk.App();
  const stack = new DevDesktopStack(app, "TestStack", {
    env: { account: "123456789012", region: "ap-southeast-2" },
    ...props,
  });
  return Template.fromStack(stack);
};

describe("DevDesktopStack", () => {
  let template: Template;

  beforeAll(() => {
    template = synthStack({ allowSshFrom: ["1.2.3.4/32"] });
  });

  test("creates EC2 instance with default t3.xlarge", () => {
    template.hasResourceProperties("AWS::EC2::Instance", {
      InstanceType: "t3.xlarge",
    });
  });

  test("creates 100GB GP3 encrypted EBS volume", () => {
    template.hasResourceProperties("AWS::EC2::Instance", {
      BlockDeviceMappings: [
        Match.objectLike({
          DeviceName: "/dev/sda1",
          Ebs: { VolumeSize: 100, VolumeType: "gp3", Encrypted: true },
        }),
      ],
    });
  });

  test("creates SSH security group ingress for allowSshFrom CIDRs", () => {
    template.hasResourceProperties("AWS::EC2::SecurityGroup", {
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({ CidrIp: "1.2.3.4/32", FromPort: 22, ToPort: 22 }),
      ]),
    });
  });

  test("attaches SSM managed policy to instance role", () => {
    template.hasResourceProperties("AWS::IAM::Role", {
      ManagedPolicyArns: Match.arrayWith([
        Match.objectLike({
          "Fn::Join": Match.arrayWith([
            Match.arrayWith([Match.stringLikeRegexp("AmazonSSMManagedInstanceCore")]),
          ]),
        }),
      ]),
    });
  });

  test("creates key pair", () => {
    template.hasResourceProperties("AWS::EC2::KeyPair", {
      KeyName: "dev-desktop-key",
    });
  });

  test("user data contains install packages and config placeholders rendered", () => {
    const userData = template.findResources("AWS::EC2::Instance");
    const instanceKey = Object.keys(userData)[0];
    const rawUserData = JSON.stringify(userData[instanceKey]);
    expect(rawUserData).toContain("apt-get install");
    expect(rawUserData).toContain("fzf");
    expect(rawUserData).toContain("xterm-ghostty");
    expect(rawUserData).toContain("zsh-autosuggestions.zsh");
    expect(rawUserData).not.toContain("{{TMUX_CONF}}");
    expect(rawUserData).not.toContain("{{ZSHRC}}");
  });

  test("outputs InstanceId, PublicIP, SSMConnect, SSHConnect, GetSSHKey", () => {
    template.hasOutput("InstanceId", {});
    template.hasOutput("PublicIP", {});
    template.hasOutput("SSMConnect", {});
    template.hasOutput("SSHConnect", {});
    template.hasOutput("GetSSHKey", {});
  });

  test("custom instance type and volume size", () => {
    const custom = synthStack({ instanceType: "t3.medium", volumeSizeGb: 50 });
    custom.hasResourceProperties("AWS::EC2::Instance", {
      InstanceType: "t3.medium",
      BlockDeviceMappings: [Match.objectLike({ Ebs: { VolumeSize: 50 } })],
    });
  });

  test("no SSH ingress when allowSshFrom is empty", () => {
    const noSsh = synthStack();
    const sgs = noSsh.findResources("AWS::EC2::SecurityGroup");
    const sgKey = Object.keys(sgs)[0];
    const props = sgs[sgKey].Properties;
    expect(props.SecurityGroupIngress).toBeUndefined();
  });
});

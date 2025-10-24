# 🔐 Create IAM User for AWS Deployment

## Why IAM User Instead of Root?

✅ **Best Practice**: Never use root account access keys  
✅ **Secure**: Limited permissions, can be revoked  
✅ **Auditable**: Track who did what  
✅ **Safe**: Root account stays protected

---

## Step 1: Create IAM User (5 minutes)

### 1.1: Go to IAM Console

1. Login to AWS: https://console.aws.amazon.com
2. Search for **"IAM"** in the top search bar
3. Click **"Identity and Access Management (IAM)"**

### 1.2: Create New User

1. In left sidebar, click **"Users"**
2. Click **"Create user"** button (top right)
3. **User name**: `petamini-deployer`
4. Click **"Next"**

### 1.3: Set Permissions

Choose **"Attach policies directly"**, then select these policies:

**For EC2 Deployment:**

- ✅ `AmazonEC2FullAccess` - Manage EC2 instances
- ✅ `AmazonVPCFullAccess` - Manage networking
- ✅ `IAMReadOnlyAccess` - Read IAM info (optional)

**For Elastic Beanstalk Deployment (if using):**

- ✅ `AdministratorAccess-AWSElasticBeanstalk`
- ✅ `AmazonEC2FullAccess`
- ✅ `AmazonS3FullAccess`

**For ECS Deployment (if using):**

- ✅ `AmazonECS_FullAccess`
- ✅ `AmazonEC2ContainerRegistryFullAccess`

Click **"Next"**

### 1.4: Review and Create

1. Review the settings
2. Click **"Create user"**
3. ✅ User created successfully!

---

## Step 2: Create Access Keys for IAM User

### 2.1: Access the User

1. Click on the newly created user: **petamini-deployer**
2. Click on **"Security credentials"** tab
3. Scroll down to **"Access keys"** section

### 2.2: Create Access Key

1. Click **"Create access key"**
2. Select use case: **"Command Line Interface (CLI)"**
3. Check the confirmation checkbox: "I understand..."
4. Click **"Next"**
5. (Optional) Add description: "PetaMini EC2 Deployment"
6. Click **"Create access key"**

### 2.3: Save Credentials

**⚠️ IMPORTANT: Save these NOW! You can't view the Secret Key again!**

```
Access Key ID: AKIAIOSFODNN7EXAMPLE
Secret Access Key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

- Click **"Download .csv file"** (recommended)
- Or copy both keys to a secure password manager

Click **"Done"**

---

## Step 3: Configure AWS CLI with IAM User

```powershell
# Configure AWS CLI
aws configure

# Enter the IAM user credentials:
AWS Access Key ID [None]: PASTE_YOUR_ACCESS_KEY_ID
AWS Secret Access Key [None]: PASTE_YOUR_SECRET_ACCESS_KEY
Default region name [None]: us-east-1
Default output format [None]: json
```

### Verify Configuration

```powershell
# Check configured credentials
aws sts get-caller-identity
```

You should see:

```json
{
  "UserId": "AIDAI...",
  "Account": "123456789012",
  "Arn": "arn:aws:iam::123456789012:user/petamini-deployer"
}
```

✅ Notice it says `user/petamini-deployer`, NOT `root`!

---

## Step 4: Run Deployment Script

Now you can safely run the deployment:

```powershell
cd "d:\telegram-mini-app\New folder\TMA\petamini"
.\deploy-aws-ec2.ps1
```

---

## 🔒 Security Best Practices

### 1. Enable MFA for IAM User (Recommended)

1. Go to IAM → Users → petamini-deployer
2. Click **"Security credentials"** tab
3. Under **"Multi-factor authentication (MFA)"**, click **"Assign MFA device"**
4. Follow the wizard to set up MFA

### 2. Rotate Access Keys Regularly

```powershell
# Create new access key
aws iam create-access-key --user-name petamini-deployer

# Update AWS CLI config
aws configure

# Delete old access key (after testing new one works)
aws iam delete-access-key --user-name petamini-deployer --access-key-id OLD_KEY_ID
```

### 3. Use Minimal Permissions

Once you know exactly what you need, create a custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:RunInstances",
        "ec2:DescribeInstances",
        "ec2:CreateKeyPair",
        "ec2:CreateSecurityGroup",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:CreateTags"
      ],
      "Resource": "*"
    }
  ]
}
```

### 4. Monitor Access

- Check **CloudTrail** logs to see all API calls
- Set up **CloudWatch** alarms for unusual activity

---

## 🆘 Troubleshooting

### "Access Denied" Error

```powershell
# Check your current identity
aws sts get-caller-identity

# If you see root user, reconfigure:
aws configure
# Enter IAM user credentials
```

### Need More Permissions

1. Go to IAM → Users → petamini-deployer
2. Click **"Add permissions"**
3. Attach the required policy

### Forgot to Save Secret Key

1. The secret key cannot be retrieved
2. Delete the access key
3. Create a new access key
4. Save it this time!

---

## 📊 Permission Comparison

| Deployment Method        | Required IAM Policies                                        |
| ------------------------ | ------------------------------------------------------------ |
| **EC2 Only**             | AmazonEC2FullAccess, AmazonVPCFullAccess                     |
| **Elastic Beanstalk**    | AdministratorAccess-AWSElasticBeanstalk, AmazonEC2FullAccess |
| **ECS Fargate**          | AmazonECS_FullAccess, AmazonEC2ContainerRegistryFullAccess   |
| **Lambda + API Gateway** | AWSLambda_FullAccess, AmazonAPIGatewayAdministrator          |

---

## ✅ Quick Checklist

- [ ] Created IAM user (not using root)
- [ ] Attached required IAM policies
- [ ] Created access keys for IAM user
- [ ] Downloaded/saved credentials securely
- [ ] Configured AWS CLI with IAM credentials
- [ ] Verified with `aws sts get-caller-identity`
- [ ] Ready to run deployment script!

---

## 🚀 Next Steps

After completing this setup:

1. **For EC2 Deployment:**

   ```powershell
   .\deploy-aws-ec2.ps1
   ```

2. **For Elastic Beanstalk:**

   ```powershell
   .\deploy-aws-beanstalk.ps1
   ```

3. **For manual setup:**
   See `COMPLETE_EC2_DEPLOYMENT.md`

---

**Your AWS account is now secure and ready for deployment!** 🎉

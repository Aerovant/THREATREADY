/* ═══════════════════════════════════════════════════════════════
   CYBERPREP v4 — COMPLETE DATABASE
   12 Roles · 3 Scenarios Each · 4 Difficulties · 180 Questions
   Replace the SCENARIOS constant in cyberprep-v4-complete.jsx
   ═══════════════════════════════════════════════════════════════ */

export const SCENARIOS = {

  // ─────────────────────────────────────────────────────────────
  // ☁️  CLOUD SECURITY (3 scenarios)
  // ─────────────────────────────────────────────────────────────
  cloud: [
    {
      id: "cl1",
      ti: "Multi-Cloud Federation Exfiltration",
      di: "advanced",
      xp: 450,
      tg: ["Zero Trust", "IAM", "Multi-Cloud"],
      es: "12-18 min",
      ar: ["Zero Trust", "Cloud Native", "IAM"],
      de: "AWS-to-Azure OIDC federation exploited. Attacker pivots from compromised AWS dev account through OIDC federation to Azure production.",
      no: [
        { id: "a", l: "Attacker",   t: "threat",  x: 20,  y: 80  },
        { id: "b", l: "AWS Dev",    t: "cloud",   x: 150, y: 20  },
        { id: "c", l: "OIDC Fed",   t: "iam",     x: 290, y: 20  },
        { id: "d", l: "Azure Prod", t: "cloud",   x: 430, y: 20  },
        { id: "e", l: "Key Vault",  t: "vault",   x: 430, y: 110 },
        { id: "f", l: "Azure SQL",  t: "db",      x: 570, y: 60  }
      ],
      ed: [
        { f: "a", t: "b", l: "Stolen STS",   a: 1 },
        { f: "b", t: "c", l: "AssumeRole",   a: 1 },
        { f: "c", t: "d", l: "Cross-cloud",  a: 1 },
        { f: "d", t: "e", l: "Secrets",      a: 1 },
        { f: "e", t: "f", l: "DB creds",     a: 1 }
      ],
      ch: [
        { s: "Initial Access",    d: "Compromised AWS dev credentials via phishing",  m: "T1078.004" },
        { s: "Lateral Movement",  d: "OIDC federation trust to Azure production",     m: "T1550.001" },
        { s: "Credential Access", d: "Key Vault secret extraction",                   m: "T1552.001" },
        { s: "Exfiltration",      d: "SQL dump staged to blob storage",               m: "T1567"     }
      ],
      po: [
        { id: "q1", ca: "Threat ID",   t: "How does cross-cloud federation create attack paths that don't exist in single-cloud environments?",                              h: "Trust boundaries span providers. OIDC creates implicit trust that bypasses cloud-native controls.", dp: 1 },
        { id: "q2", ca: "Containment", t: "The attacker is actively exfiltrating from Azure SQL. What are your first 3 containment actions?",                               h: "Revoke OIDC federation trust, rotate Key Vault secrets, network isolate Azure SQL.",              dp: 2 },
        { id: "q3", ca: "Detection",   t: "Design CloudTrail and Azure Monitor detections for each phase of this attack chain.",                                             h: "AssumeRoleWithWebIdentity from unknown OIDC, Key Vault access from new IPs, SQL bulk export.",    dp: 3 },
        { id: "q4", ca: "Architecture",t: "Redesign this multi-cloud architecture to prevent federation abuse while maintaining developer productivity.",                    h: "Conditional access, JIT federation, workload identity federation with strict audience claims.",    dp: 3 },
        { id: "q5", ca: "Post-Incident",t:"Write the executive summary for the incident report. What systemic failures enabled this breach?",                                h: "Overly permissive federation trust, no conditional access, shared dev creds, no Key Vault alerts.",dp: 2 }
      ]
    },

    {
      id: "cl2",
      ti: "S3 Bucket Misconfiguration Chain",
      di: "beginner",
      xp: 200,
      tg: ["S3", "IAM", "Data Security"],
      es: "5-8 min",
      ar: ["Cloud Native", "Data Security"],
      de: "Public S3 bucket exposes customer PII. Attacker discovers bucket via DNS enumeration, downloads sensitive data, uses found API keys to pivot deeper into AWS.",
      no: [
        { id: "a", l: "Attacker",     t: "threat",   x: 20,  y: 60 },
        { id: "b", l: "Public S3",    t: "storage",  x: 180, y: 20 },
        { id: "c", l: "API Keys",     t: "iam",      x: 340, y: 60 },
        { id: "d", l: "EC2 Instances",t: "compute",  x: 500, y: 20 }
      ],
      ed: [
        { f: "a", t: "b", l: "DNS enum",      a: 1 },
        { f: "b", t: "c", l: "Found in files",a: 1 },
        { f: "c", t: "d", l: "API access",    a: 1 }
      ],
      ch: [
        { s: "Reconnaissance",   d: "S3 bucket discovered via DNS brute force",   m: "T1592"     },
        { s: "Collection",       d: "Download customer data from public bucket",  m: "T1530"     },
        { s: "Credential Access",d: "API keys found in configuration files",      m: "T1552.001" }
      ],
      po: [
        { id: "q1", ca: "Threat ID",   t: "Why are S3 bucket misconfigurations so common? What makes them easy to find?",                       h: "Default configs, DNS patterns, tools like bucket-finder make enumeration trivial.",                    dp: 1 },
        { id: "q2", ca: "Remediation", t: "You've discovered this bucket is public. What are your immediate remediation steps?",                 h: "Block public access, audit bucket policies, rotate all found credentials, enable access logging.",       dp: 1 },
        { id: "q3", ca: "Prevention",  t: "Design an S3 security policy that prevents this across your entire AWS organization.",                h: "SCP to deny public buckets, Config rules, Macie for PII detection, bucket versioning.",                  dp: 2 },
        { id: "q4", ca: "Detection",   t: "How would you detect if someone has already accessed this public bucket before you found it?",        h: "S3 access logs, CloudTrail data events, check for unusual GetObject from external IPs.",                 dp: 2 },
        { id: "q5", ca: "Architecture",t: "What AWS-native controls should be in place to prevent ANY bucket from ever being made public?",      h: "Account-level S3 Block Public Access, SCPs, AWS Config auto-remediation rules.",                        dp: 1 }
      ]
    },

    {
      id: "cl3",
      ti: "Lambda Backdoor via Overprivileged IAM",
      di: "expert",
      xp: 500,
      tg: ["Lambda", "IAM", "Persistence"],
      es: "15-20 min",
      ar: ["Serverless", "IAM", "Detection"],
      de: "Attacker creates a Lambda function with overprivileged IAM role, triggered daily via CloudWatch Events, exfiltrating data to external endpoint while appearing as legitimate automation.",
      no: [
        { id: "a", l: "Attacker",    t: "threat",   x: 20,  y: 60  },
        { id: "b", l: "IAM Role",    t: "iam",      x: 180, y: 20  },
        { id: "c", l: "Lambda",      t: "lambda",   x: 340, y: 60  },
        { id: "d", l: "CloudWatch",  t: "monitor",  x: 340, y: 140 },
        { id: "e", l: "DynamoDB",    t: "db",       x: 500, y: 20  },
        { id: "f", l: "External C2", t: "c2",       x: 500, y: 120 }
      ],
      ed: [
        { f: "a", t: "b", l: "Create role",   a: 1 },
        { f: "b", t: "c", l: "Attach",        a: 1 },
        { f: "d", t: "c", l: "Trigger daily"        },
        { f: "c", t: "e", l: "Read data",     a: 1 },
        { f: "c", t: "f", l: "Exfiltrate",    a: 1 }
      ],
      ch: [
        { s: "Persistence",          d: "Lambda with CloudWatch scheduled trigger",  m: "T1053.007" },
        { s: "Privilege Escalation",  d: "Overprivileged IAM role creation",         m: "T1098.001" },
        { s: "Collection",            d: "DynamoDB table scan",                      m: "T1530"     },
        { s: "Exfiltration",          d: "HTTPS POST to external endpoint",          m: "T1567"     }
      ],
      po: [
        { id: "q1", ca: "Threat ID",       t: "Why is Lambda particularly dangerous for persistence compared to EC2? What makes it harder to detect?",               h: "No SSH, no process list, event-driven execution leaves minimal footprint, blends with automation.", dp: 3 },
        { id: "q2", ca: "Detection",       t: "Design a comprehensive detection strategy for malicious Lambda functions across your AWS organization.",              h: "CloudTrail CreateFunction, IAM role trust policies, Lambda env vars, VPC flow logs for outbound.",  dp: 3 },
        { id: "q3", ca: "Forensics",       t: "You suspect a Lambda is exfiltrating data. Walk through your forensic investigation process.",                       h: "Lambda invocation logs, X-Ray traces, VPC flow logs, IAM credential report, CW metrics anomalies.",dp: 3 },
        { id: "q4", ca: "Architecture",    t: "Design a Lambda security framework that prevents unauthorized function deployment across 50+ AWS accounts.",          h: "SCPs limiting Lambda creation, mandatory VPC, no IGW, function URL restrictions, code signing.",   dp: 3 },
        { id: "q5", ca: "Incident Response",t:"This Lambda has been running for 90 days. Assess the blast radius and create a remediation plan.",                   h: "Audit all data accessed, check IAM usage history, identify exfiltrated records, regulatory notification.", dp: 3 }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 🔧  DEVSECOPS (3 scenarios)
  // ─────────────────────────────────────────────────────────────
  devsecops: [
    {
      id: "ds1",
      ti: "Container Supply Chain Poisoning",
      di: "advanced",
      xp: 400,
      tg: ["Container", "Supply Chain", "K8s"],
      es: "12-16 min",
      ar: ["Kubernetes Security", "DevSecOps Pipeline"],
      de: "Compromised base image propagates through build pipeline. No image signing allows malicious image into production EKS.",
      no: [
        { id: "a", l: "Docker Hub",      t: "threat",   x: 20,  y: 20  },
        { id: "b", l: "GitHub Actions",  t: "cicd",     x: 170, y: 60  },
        { id: "c", l: "Trivy Scanner",   t: "monitor",  x: 320, y: 120 },
        { id: "d", l: "Private ECR",     t: "registry", x: 320, y: 20  },
        { id: "e", l: "OPA Gatekeeper",  t: "policy",   x: 470, y: 120 },
        { id: "f", l: "EKS Prod",        t: "k8s",      x: 470, y: 20  }
      ],
      ed: [
        { f: "a", t: "b", l: "Poisoned base",   a: 1 },
        { f: "b", t: "c", l: "Scan bypassed",   a: 1 },
        { f: "b", t: "d", l: "Push unsigned",   a: 1 },
        { f: "d", t: "f", l: "Deploy",          a: 1 },
        { f: "e", t: "f", l: "No policy"              }
      ],
      ch: [
        { s: "Initial Access",    d: "Typosquatted base image",              m: "T1195.002" },
        { s: "Defense Evasion",   d: "Malware in image layer passes scan",   m: "T1036"     },
        { s: "Execution",         d: "Entrypoint deploys cryptominer",       m: "T1059.004" },
        { s: "Impact",            d: "Resource hijacking across cluster",    m: "T1496"     }
      ],
      po: [
        { id: "q1", ca: "Threat ID",        t: "How does a supply chain attack through container images differ from traditional software attacks?",                  h: "Image layers, build cache poisoning, trust chain from base to production.",                   dp: 1 },
        { id: "q2", ca: "Pipeline Security",t: "Design a secure container build pipeline that prevents this attack.",                                               h: "Trivy/Grype in CI, Cosign signing, OPA Gatekeeper admission webhook.",                        dp: 2 },
        { id: "q3", ca: "Architecture",     t: "Design a zero-trust container supply chain with provenance attestation.",                                           h: "SLSA framework, in-toto attestations, Kyverno policies.",                                    dp: 3 },
        { id: "q4", ca: "Detection",        t: "How would you detect a compromised container already running in production?",                                       h: "Runtime security (Falco), unexpected network connections, resource usage anomalies.",         dp: 2 },
        { id: "q5", ca: "Remediation",      t: "A cryptominer is running in your production cluster. Walk through containment and eradication.",                    h: "Isolate pod, capture forensic image, identify affected nodes, rebuild from trusted base.",    dp: 2 }
      ]
    },

    {
      id: "ds2",
      ti: "Secrets Leaked in Git History",
      di: "intermediate",
      xp: 300,
      tg: ["Secrets Management", "Git", "IaC"],
      es: "10-14 min",
      ar: ["DevSecOps Pipeline", "Secrets Management"],
      de: "Developer accidentally commits AWS access keys and database passwords to a public GitHub repo. Keys are scraped by automated bots within minutes and used to mine cryptocurrency.",
      no: [
        { id: "a", l: "Developer",  t: "user",    x: 20,  y: 60  },
        { id: "b", l: "GitHub",     t: "cicd",    x: 180, y: 20  },
        { id: "c", l: "Scraper Bot",t: "threat",  x: 180, y: 110 },
        { id: "d", l: "AWS Keys",   t: "iam",     x: 340, y: 60  },
        { id: "e", l: "EC2 Fleet",  t: "compute", x: 500, y: 20  },
        { id: "f", l: "RDS Prod",   t: "db",      x: 500, y: 110 }
      ],
      ed: [
        { f: "a", t: "b", l: "Push commit",  a: 1 },
        { f: "b", t: "c", l: "Scraped",      a: 1 },
        { f: "c", t: "d", l: "Extract keys", a: 1 },
        { f: "d", t: "e", l: "Spin EC2",     a: 1 },
        { f: "d", t: "f", l: "Access DB",    a: 1 }
      ],
      ch: [
        { s: "Credential Access", d: "Secrets committed to public repository",          m: "T1552.001" },
        { s: "Initial Access",    d: "Valid credentials used from scraped repo",        m: "T1078"     },
        { s: "Resource Hijacking",d: "EC2 instances launched for crypto mining",        m: "T1496"     },
        { s: "Collection",        d: "Database credentials used to access RDS",        m: "T1530"     }
      ],
      po: [
        { id: "q1", ca: "Threat ID",         t: "How quickly can secrets leaked to a public GitHub repo be exploited? What bots exist for this?",           h: "Seconds to minutes. Tools like truffleHog, GitGuardian, dedicated credential scrapers operate 24/7.", dp: 1 },
        { id: "q2", ca: "Immediate Response", t: "The keys were pushed 5 minutes ago. What are your immediate containment steps?",                          h: "Revoke keys in IAM, check CloudTrail for usage, git history rewrite, GitHub secret scanning alert.", dp: 2 },
        { id: "q3", ca: "Prevention",        t: "Design a pre-commit pipeline that prevents secrets from ever reaching any Git repository.",                 h: "Pre-commit hooks (detect-secrets, gitleaks), GitHub secret scanning, mandatory secrets manager.",    dp: 2 },
        { id: "q4", ca: "Architecture",      t: "Design an enterprise secrets management strategy for a 200-person engineering org using AWS.",              h: "AWS Secrets Manager, Parameter Store, IRSA for pod identity, vault for cross-cloud.",               dp: 3 },
        { id: "q5", ca: "Detection",         t: "Build a detection system that alerts within 60 seconds of any secret being committed org-wide.",           h: "GitHub Advanced Security, GitGuardian, CodePipeline webhooks, CloudWatch custom metrics.",           dp: 3 }
      ]
    },

    {
      id: "ds3",
      ti: "Terraform State File Exposure",
      di: "intermediate",
      xp: 280,
      tg: ["IaC", "Terraform", "S3", "Secrets"],
      es: "10-13 min",
      ar: ["IaC Security", "DevSecOps"],
      de: "Terraform state file stored in S3 contains plaintext RDS passwords, IAM keys, and private TLS certificates. S3 bucket has overly permissive bucket policy readable by any authenticated AWS user.",
      no: [
        { id: "a", l: "Attacker",   t: "threat",  x: 20,  y: 60  },
        { id: "b", l: "S3 Bucket",  t: "storage", x: 180, y: 20  },
        { id: "c", l: "tfstate",    t: "vault",   x: 340, y: 60  },
        { id: "d", l: "RDS",        t: "db",      x: 500, y: 20  },
        { id: "e", l: "IAM Keys",   t: "iam",     x: 500, y: 110 }
      ],
      ed: [
        { f: "a", t: "b", l: "Auth AWS user", a: 1 },
        { f: "b", t: "c", l: "Download state",a: 1 },
        { f: "c", t: "d", l: "Plaintext creds",a:1 },
        { f: "c", t: "e", l: "IAM keys",       a:1 }
      ],
      ch: [
        { s: "Discovery",         d: "S3 bucket policy allows all authenticated AWS users",  m: "T1083"     },
        { s: "Credential Access", d: "Plaintext secrets extracted from Terraform state",     m: "T1552.001" },
        { s: "Lateral Movement",  d: "IAM keys used to pivot to other services",             m: "T1550"     }
      ],
      po: [
        { id: "q1", ca: "Threat ID",    t: "Why does Terraform store sensitive values in plaintext in state files? What is the root design issue?",         h: "State represents real infra resources including outputs. Terraform has no built-in encryption at rest.", dp: 1 },
        { id: "q2", ca: "Remediation",  t: "You found the exposed state file. What are your remediation steps to both fix the exposure and rotate secrets?", h: "Lock S3 bucket, rotate all extracted creds, invalidate TLS certs, audit access logs for prior access.", dp: 2 },
        { id: "q3", ca: "Architecture", t: "Design a secure Terraform remote state architecture for a multi-team enterprise.",                               h: "S3 + DynamoDB with least-privilege IAM, SSE-KMS, access logging, separate state per env/team.",        dp: 3 },
        { id: "q4", ca: "Prevention",   t: "How do you prevent sensitive data from ever appearing in Terraform outputs and state?",                          h: "sensitive = true in outputs, use data sources not resources for secrets, inject via env vars.",         dp: 2 },
        { id: "q5", ca: "Detection",    t: "Write a detection rule that alerts when Terraform state files are accessed by unexpected principals.",           h: "S3 server access logging + CloudWatch Logs filter + SNS alert on GetObject from non-terraform role.",  dp: 2 }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 🛡️  APPLICATION SECURITY (3 scenarios)
  // ─────────────────────────────────────────────────────────────
  appsec: [
    {
      id: "as1",
      ti: "OAuth 2.0 Token Theft via Open Redirect",
      di: "advanced",
      xp: 400,
      tg: ["OAuth", "API Security", "IAM"],
      es: "12-16 min",
      ar: ["API Security", "IAM", "Zero Trust"],
      de: "Chained open redirect in OAuth flow. Attacker intercepts authorization code, exchanges for access token, accesses user data.",
      no: [
        { id: "a", l: "Attacker",       t: "threat", x: 20,  y: 60  },
        { id: "b", l: "Victim",         t: "user",   x: 150, y: 20  },
        { id: "c", l: "OAuth Provider", t: "iam",    x: 290, y: 20  },
        { id: "d", l: "Open Redirect",  t: "api",    x: 290, y: 120 },
        { id: "e", l: "Resource API",   t: "api",    x: 430, y: 20  },
        { id: "f", l: "User Data",      t: "db",     x: 570, y: 60  }
      ],
      ed: [
        { f: "a", t: "b", l: "Phishing",     a: 1 },
        { f: "b", t: "c", l: "Authorize",    a: 1 },
        { f: "c", t: "d", l: "Code+redirect",a: 1 },
        { f: "d", t: "a", l: "Intercept",    a: 1 },
        { f: "a", t: "e", l: "Access token", a: 1 },
        { f: "e", t: "f", l: "Read data",    a: 1 }
      ],
      ch: [
        { s: "Initial Access",    d: "Phishing with crafted OAuth link",          m: "T1566.002" },
        { s: "Credential Access", d: "Authorization code intercepted",           m: "T1528"     },
        { s: "Collection",        d: "API calls harvest user data",              m: "T1530"     }
      ],
      po: [
        { id: "q1", ca: "Threat ID",    t: "Walk through the OAuth 2.0 authorization code flow and identify where redirect_uri validation fails.",                    h: "Subdomain matching, path traversal in redirect_uri validation allows attacker-controlled redirects.",  dp: 1 },
        { id: "q2", ca: "AppSec",       t: "What OAuth 2.0 security best practices prevent this? Compare with and without PKCE.",                                     h: "PKCE binds code to client, exact redirect_uri matching, state parameter, short-lived codes.",         dp: 2 },
        { id: "q3", ca: "Architecture", t: "Design a zero-trust API authentication architecture resilient to token theft.",                                           h: "Mutual TLS, DPoP tokens, continuous authentication, behavioral analysis.",                           dp: 3 },
        { id: "q4", ca: "Detection",    t: "How would you detect OAuth token theft in production?",                                                                   h: "Unusual token exchange patterns, geographic anomalies, device fingerprint mismatch.",               dp: 2 },
        { id: "q5", ca: "Remediation",  t: "Tokens have been stolen for 1000 users. What's your incident response plan?",                                            h: "Revoke all affected tokens, force re-auth, notify users, audit access logs for scope of access.",    dp: 2 }
      ]
    },

    {
      id: "as2",
      ti: "GraphQL Introspection & Batch Query Attack",
      di: "intermediate",
      xp: 320,
      tg: ["GraphQL", "API Security", "OWASP"],
      es: "10-14 min",
      ar: ["API Security", "AppSec"],
      de: "Production GraphQL API has introspection enabled and no query depth/complexity limits. Attacker maps the full schema, then uses batching to bypass rate limits and exfiltrate all user records.",
      no: [
        { id: "a", l: "Attacker",   t: "threat", x: 20,  y: 60  },
        { id: "b", l: "GraphQL API",t: "api",    x: 200, y: 30  },
        { id: "c", l: "Rate Limiter",t:"waf",    x: 200, y: 120 },
        { id: "d", l: "User DB",    t: "db",     x: 400, y: 30  },
        { id: "e", l: "Auth Service",t:"iam",    x: 400, y: 120 }
      ],
      ed: [
        { f: "a", t: "b", l: "Introspection", a: 1 },
        { f: "b", t: "c", l: "Bypass batch",  a: 1 },
        { f: "b", t: "d", l: "Batch query",   a: 1 },
        { f: "d", t: "e", l: "Auth bypass"          }
      ],
      ch: [
        { s: "Reconnaissance",    d: "GraphQL introspection reveals full schema",   m: "T1590"     },
        { s: "Defense Evasion",   d: "Batch queries bypass per-request rate limits",m: "T1562"     },
        { s: "Collection",        d: "Bulk user data exfiltration via nested queries",m: "T1530"   }
      ],
      po: [
        { id: "q1", ca: "Threat ID",    t: "Why is GraphQL introspection dangerous in production, and what does it expose to an attacker?",                        h: "Exposes full schema: all types, fields, relationships, mutations — a complete attack map.",            dp: 1 },
        { id: "q2", ca: "API Security", t: "How does GraphQL batching bypass traditional rate limiting? Design a fix.",                                            h: "Batch counts as 1 request but runs N queries. Use query complexity scoring + per-operation limits.",  dp: 2 },
        { id: "q3", ca: "Prevention",   t: "Define a comprehensive GraphQL security hardening checklist for production APIs.",                                     h: "Disable introspection, depth limiting, complexity scoring, persisted queries, field-level auth.",     dp: 2 },
        { id: "q4", ca: "Architecture", t: "Design a GraphQL API gateway that enforces zero trust without breaking legitimate developer tooling.",                 h: "Allowlisted query IDs for prod, introspection behind auth for dev, schema stitching with policies.",  dp: 3 },
        { id: "q5", ca: "Detection",    t: "How would you detect GraphQL abuse in production before full exfiltration occurs?",                                   h: "Monitor introspection calls, unusual query depth/complexity, high resolver latency spikes.",          dp: 2 }
      ]
    },

    {
      id: "as3",
      ti: "SSRF via PDF Export Feature",
      di: "advanced",
      xp: 380,
      tg: ["SSRF", "Cloud Metadata", "API Security"],
      es: "12-16 min",
      ar: ["AppSec", "Cloud Native"],
      de: "A SaaS application's PDF export feature uses a headless browser to render URLs. Attacker exploits SSRF to reach the EC2 metadata endpoint, steals IAM credentials, and pivots into AWS.",
      no: [
        { id: "a", l: "Attacker",      t: "threat",  x: 20,  y: 60  },
        { id: "b", l: "PDF Service",   t: "api",     x: 200, y: 30  },
        { id: "c", l: "Headless Chrome",t:"compute", x: 200, y: 120 },
        { id: "d", l: "IMDS v1",       t: "iam",     x: 400, y: 60  },
        { id: "e", l: "IAM Role Creds",t: "vault",   x: 570, y: 30  },
        { id: "f", l: "AWS Services",  t: "cloud",   x: 570, y: 110 }
      ],
      ed: [
        { f: "a", t: "b", l: "Craft URL",        a: 1 },
        { f: "b", t: "c", l: "Render request",   a: 1 },
        { f: "c", t: "d", l: "169.254.169.254",  a: 1 },
        { f: "d", t: "e", l: "Return creds",     a: 1 },
        { f: "e", t: "f", l: "AWS API calls",    a: 1 }
      ],
      ch: [
        { s: "Initial Access",    d: "SSRF via user-controlled URL in PDF export", m: "T1190"     },
        { s: "Credential Access", d: "IMDSv1 returns IAM role credentials",       m: "T1552.005" },
        { s: "Lateral Movement",  d: "Stolen IAM creds used for AWS API calls",   m: "T1550"     }
      ],
      po: [
        { id: "q1", ca: "Threat ID",    t: "Why is IMDSv1 particularly dangerous in SSRF scenarios compared to IMDSv2?",                                        h: "IMDSv1 requires no session token — any GET to 169.254.169.254 returns credentials. No hop check.",   dp: 1 },
        { id: "q2", ca: "Remediation",  t: "IMDSv1 was used to steal credentials. What are your immediate containment steps?",                                 h: "Rotate IAM role, force IMDSv2, audit CloudTrail for cred usage, block internal URL rendering.",       dp: 2 },
        { id: "q3", ca: "Prevention",   t: "How do you fix the SSRF vulnerability in the PDF export feature at the application level?",                        h: "URL allowlisting, DNS rebinding prevention, remove URL rendering or use signed URLs, deploy WAF.",     dp: 2 },
        { id: "q4", ca: "Architecture", t: "Design a secure PDF generation service that is immune to SSRF and metadata theft.",                                h: "Isolated network namespace, no internet access, IMDSv2 enforced, pre-signed S3 content delivery.",    dp: 3 },
        { id: "q5", ca: "Detection",    t: "Build a detection for SSRF attempts targeting the EC2 metadata service from application instances.",               h: "VPC flow logs for 169.254.169.254 from app servers, WAF rules, IMDS access logging in CloudTrail.",   dp: 3 }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 🌐  NETWORK SECURITY (3 scenarios)
  // ─────────────────────────────────────────────────────────────
  netsec: [
    {
      id: "ns1",
      ti: "East-West Lateral Movement via Service Mesh",
      di: "advanced",
      xp: 420,
      tg: ["Zero Trust", "Service Mesh", "Microsegmentation"],
      es: "12-18 min",
      ar: ["Zero Trust", "Network Security"],
      de: "Attacker compromises a low-privilege microservice and uses implicit service mesh trust to pivot laterally, accessing payment and PII services without any north-south detection.",
      no: [
        { id: "a", l: "Attacker",      t: "threat",  x: 20,  y: 60  },
        { id: "b", l: "App Service",   t: "compute", x: 180, y: 20  },
        { id: "c", l: "Service Mesh",  t: "network", x: 340, y: 60  },
        { id: "d", l: "Payment Svc",   t: "api",     x: 500, y: 20  },
        { id: "e", l: "PII Service",   t: "db",      x: 500, y: 110 },
        { id: "f", l: "SIEM",          t: "siem",    x: 340, y: 140 }
      ],
      ed: [
        { f: "a", t: "b", l: "Exploit vuln",     a: 1 },
        { f: "b", t: "c", l: "mTLS bypass",      a: 1 },
        { f: "c", t: "d", l: "No authz policy",  a: 1 },
        { f: "c", t: "e", l: "Implicit trust",   a: 1 },
        { f: "f", t: "c", l: "No visibility"           }
      ],
      ch: [
        { s: "Initial Access",   d: "Exploit in public-facing application service",          m: "T1190"     },
        { s: "Lateral Movement", d: "Service mesh implicit trust allows E-W movement",      m: "T1021"     },
        { s: "Collection",       d: "Access to payment and PII microservices",              m: "T1530"     },
        { s: "Defense Evasion",  d: "East-west traffic evades perimeter detection",        m: "T1599"     }
      ],
      po: [
        { id: "q1", ca: "Threat ID",    t: "Why does a service mesh (Istio/Linkerd) not automatically provide security? What trust model does it default to?",   h: "mTLS encrypts traffic but default AuthorizationPolicy is ALLOW. Encryption ≠ authorization.",        dp: 2 },
        { id: "q2", ca: "Containment",  t: "A microservice is compromised and pivoting. How do you contain it without taking down your entire service mesh?",    h: "Apply AuthorizationPolicy DENY to compromised service, capture current connections, pod isolation.", dp: 2 },
        { id: "q3", ca: "Architecture", t: "Design a zero trust microsegmentation architecture for 30 microservices. What is your policy model?",                h: "Default deny, explicit allow by service identity, namespace isolation, PeerAuthentication STRICT.",  dp: 3 },
        { id: "q4", ca: "Detection",    t: "Design east-west network monitoring that catches lateral movement without overwhelming your SIEM.",                   h: "Envoy access logs aggregation, anomalous service-to-service patterns, baseline deviation alerts.",   dp: 3 },
        { id: "q5", ca: "Prevention",   t: "How do you enforce least privilege between microservices in a CI/CD pipeline without slowing deployments?",          h: "AuthorizationPolicy as code in Helm charts, policy linting in CI, GitOps enforcement.",             dp: 3 }
      ]
    },

    {
      id: "ns2",
      ti: "DNS Tunneling for C2 Exfiltration",
      di: "intermediate",
      xp: 300,
      tg: ["DNS", "C2", "Exfiltration"],
      es: "10-14 min",
      ar: ["Network Security", "Detection"],
      de: "APT group uses DNS tunneling to establish covert C2 channel. DNS queries appear legitimate but encode data in subdomains. Firewall allows all outbound DNS, creating a blind spot.",
      no: [
        { id: "a", l: "Infected Host",  t: "endpoint",x: 20,  y: 60  },
        { id: "b", l: "Internal DNS",   t: "dns",     x: 200, y: 30  },
        { id: "c", l: "Firewall",       t: "firewall",x: 200, y: 120 },
        { id: "d", l: "External DNS",   t: "dns",     x: 380, y: 60  },
        { id: "e", l: "C2 Server",      t: "c2",      x: 560, y: 60  }
      ],
      ed: [
        { f: "a", t: "b", l: "DNS query",      a: 1 },
        { f: "b", t: "c", l: "Forwarded",      a: 1 },
        { f: "c", t: "d", l: "Allowed port 53",a: 1 },
        { f: "d", t: "e", l: "TXT record C2",  a: 1 }
      ],
      ch: [
        { s: "C2",            d: "DNS TXT queries carry encoded C2 commands",    m: "T1071.004" },
        { s: "Exfiltration",  d: "Data encoded in DNS subdomain labels",        m: "T1048.003" },
        { s: "Defense Evasion",d: "DNS traffic bypasses content inspection",    m: "T1572"     }
      ],
      po: [
        { id: "q1", ca: "Threat ID",    t: "How does DNS tunneling work technically? What makes it hard to detect with traditional firewalls?",               h: "Data encoded in subdomain labels (base64). Port 53 is always allowed, content rarely inspected.",    dp: 1 },
        { id: "q2", ca: "Detection",    t: "Design a DNS anomaly detection system that catches tunneling with minimal false positives.",                       h: "High query frequency, long subdomain names, high entropy labels, rare/new TLDs, TTL=0 patterns.",    dp: 2 },
        { id: "q3", ca: "Architecture", t: "Design a network architecture that eliminates DNS tunneling as an exfiltration path.",                             h: "DNS firewall (Route53 Resolver, Umbrella), recursive DNS inspection, DNS over HTTPS controls.",      dp: 3 },
        { id: "q4", ca: "Forensics",    t: "You suspect DNS tunneling on a specific endpoint. Walk through your forensic investigation.",                      h: "Capture DNS logs, analyze query entropy, track target domains, correlate with EDR telemetry.",       dp: 2 },
        { id: "q5", ca: "Prevention",   t: "Your organization must allow external DNS. How do you prevent tunneling without breaking legitimate operations?",  h: "DNS RPZ blocking, query rate limiting per host, allowlisted resolvers only, split DNS architecture.", dp: 2 }
      ]
    },

    {
      id: "ns3",
      ti: "VPN Credential Stuffing & SSL-VPN Exploit",
      di: "expert",
      xp: 480,
      tg: ["VPN", "Zero Trust", "Remote Access"],
      es: "15-20 min",
      ar: ["Network Security", "Zero Trust", "IAM"],
      de: "Threat actor exploits unpatched SSL-VPN CVE then uses credential stuffing against VPN portal. Gains persistent access, establishes split tunnel to exfiltrate via personal device.",
      no: [
        { id: "a", l: "Attacker",    t: "threat",   x: 20,  y: 60  },
        { id: "b", l: "VPN Gateway", t: "vpn",      x: 200, y: 30  },
        { id: "c", l: "AD / LDAP",   t: "ad",       x: 380, y: 30  },
        { id: "d", l: "Corp Network",t: "network",  x: 380, y: 120 },
        { id: "e", l: "File Shares", t: "storage",  x: 560, y: 60  }
      ],
      ed: [
        { f: "a", t: "b", l: "CVE exploit",       a: 1 },
        { f: "b", t: "c", l: "AD auth bypass",    a: 1 },
        { f: "b", t: "d", l: "Full tunnel access",a: 1 },
        { f: "d", t: "e", l: "Lateral access",    a: 1 }
      ],
      ch: [
        { s: "Initial Access",   d: "SSL-VPN CVE gives unauthenticated access",    m: "T1190"     },
        { s: "Defense Evasion",  d: "Valid VPN credentials used to blend in",      m: "T1078"     },
        { s: "Lateral Movement", d: "VPN provides full corp network access",       m: "T1021.002" },
        { s: "Exfiltration",     d: "Data staged and exfiltrated via split tunnel",m: "T1048"     }
      ],
      po: [
        { id: "q1", ca: "Threat ID",    t: "Why are SSL-VPN appliances a top initial access vector in 2024-2025? What makes patching difficult?",             h: "Internet-exposed, can't take offline easily, CVEs weaponized in hours, vendor patch delays.",        dp: 2 },
        { id: "q2", ca: "Containment",  t: "You detect a compromised VPN session. What are your containment steps without locking out all remote workers?",  h: "Terminate specific session, force MFA re-auth, apply geo-block, monitor AD for lateral movement.",   dp: 2 },
        { id: "q3", ca: "Architecture", t: "Design a Zero Trust Network Access (ZTNA) replacement for traditional VPN. What does the migration look like?",  h: "SDP/ZTNA broker, identity-aware proxy, device posture checks, micro-segmentation replaces VPN.",     dp: 3 },
        { id: "q4", ca: "Detection",    t: "Design detections for VPN credential stuffing that distinguish bots from legitimate failed logins.",              h: "Login velocity per IP, ASN reputation, geolocation anomaly, device fingerprint correlation.",       dp: 3 },
        { id: "q5", ca: "Post-Incident",t: "Attacker had VPN access for 2 weeks. How do you scope the breach and identify what was accessed?",               h: "VPN session logs, AD access logs, file access audit, DLP log review, network flow analysis.",       dp: 3 }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 📦  PRODUCT SECURITY (3 scenarios)
  // ─────────────────────────────────────────────────────────────
  prodsec: [
    {
      id: "ps1",
      ti: "Third-Party SDK Data Harvesting",
      di: "intermediate",
      xp: 310,
      tg: ["Supply Chain", "SDK", "Privacy"],
      es: "10-14 min",
      ar: ["Product Security", "Privacy"],
      de: "A widely used analytics SDK embedded in your mobile app is found to silently collect PII, device fingerprints, and location data beyond its documented scope.",
      no: [
        { id: "a", l: "Mobile App",   t: "endpoint",x: 20,  y: 60  },
        { id: "b", l: "Analytics SDK",t: "threat",  x: 200, y: 30  },
        { id: "c", l: "SDK Server",   t: "c2",      x: 380, y: 30  },
        { id: "d", l: "User PII",     t: "db",      x: 560, y: 60  }
      ],
      ed: [
        { f: "a", t: "b", l: "Embedded SDK",   a: 1 },
        { f: "b", t: "c", l: "Silent upload",  a: 1 },
        { f: "c", t: "d", l: "Store PII",      a: 1 }
      ],
      ch: [
        { s: "Collection",         d: "SDK harvests PII beyond documented scope",  m: "T1005"     },
        { s: "Exfiltration",       d: "Data sent to third-party vendor servers",   m: "T1567"     },
        { s: "Defense Evasion",    d: "Obfuscated SDK code hides data collection", m: "T1027"     }
      ],
      po: [
        { id: "q1", ca: "Threat ID",    t: "How do you perform a security review of a third-party SDK before approving it for mobile app integration?",         h: "Static analysis (MobSF), network traffic interception, permission audit, vendor security questionnaire.", dp: 1 },
        { id: "q2", ca: "Legal/Privacy",t: "This SDK violated GDPR and CCPA. What are your immediate legal and technical obligations?",                        h: "72-hour GDPR breach notification, DPA notification, user notification, SDK removal, legal hold.",        dp: 2 },
        { id: "q3", ca: "Architecture", t: "Design a third-party SDK governance framework that prevents unauthorized data collection in mobile products.",      h: "SDK allowlist, network traffic policy (NSAppTransportSecurity), runtime permission sandboxing.",         dp: 3 },
        { id: "q4", ca: "Detection",    t: "How do you continuously monitor third-party SDKs in production apps for behavioral changes?",                      h: "Binary diff on SDK updates, network egress monitoring, dynamic analysis in CI, SBOM tracking.",         dp: 3 },
        { id: "q5", ca: "Prevention",   t: "Define a vendor security assessment process for SDKs that balances security depth with engineering velocity.",      h: "Tiered risk assessment, automated SBOM checks, contractual security obligations, audit rights.",        dp: 2 }
      ]
    },

    {
      id: "ps2",
      ti: "Security Design Review: Payment Feature",
      di: "advanced",
      xp: 430,
      tg: ["Threat Modeling", "PCI-DSS", "Design Review"],
      es: "12-18 min",
      ar: ["Product Security", "GRC"],
      de: "Your team is adding a stored payment card feature to a SaaS B2B product. You are the product security engineer tasked with a full security design review before any code is written.",
      no: [
        { id: "a", l: "User",          t: "user",   x: 20,  y: 60  },
        { id: "b", l: "Frontend",      t: "api",    x: 180, y: 30  },
        { id: "c", l: "Payment API",   t: "api",    x: 360, y: 30  },
        { id: "d", l: "Vault / Tokens",t: "vault",  x: 360, y: 120 },
        { id: "e", l: "Card DB",       t: "db",     x: 540, y: 60  }
      ],
      ed: [
        { f: "a", t: "b", l: "Submit card",  a: 1 },
        { f: "b", t: "c", l: "API call",     a: 1 },
        { f: "c", t: "d", l: "Tokenize",     a: 1 },
        { f: "d", t: "e", l: "Store token",  a: 1 }
      ],
      ch: [
        { s: "Design Risk", d: "Storing PANs requires PCI-DSS Level 1 compliance",   m: "T1530" },
        { s: "Attack Surface",d:"API exposure increases card skimming risk",          m: "T1190" }
      ],
      po: [
        { id: "q1", ca: "Threat Modeling",t: "Apply STRIDE to the stored card feature. What are the top 3 threats?",                                              h: "Spoofing (fake card submission), Info Disclosure (card DB breach), Tampering (token substitution).", dp: 1 },
        { id: "q2", ca: "Compliance",     t: "What PCI-DSS requirements apply to storing card-on-file? What is the minimum viable scope?",                        h: "PCI SAQ D or Level 1 QSA, tokenization to reduce scope, P2PE to avoid PAN storage entirely.",        dp: 2 },
        { id: "q3", ca: "Architecture",   t: "Design the payment feature to be out-of-scope for PCI-DSS while still meeting the user requirement.",              h: "Use Stripe/Braintree with JS SDK, never touch PANs, iframe tokenization, PCI bridge pattern.",        dp: 3 },
        { id: "q4", ca: "Security Controls",t:"List the top 10 security controls required before this feature ships.",                                           h: "Pen test, 3DS2, rate limiting, fraud detection, TLS 1.3, HSM key storage, RBAC, audit logging.",     dp: 2 },
        { id: "q5", ca: "Post-Launch",    t: "How do you continuously monitor a payment feature for fraud and security issues post-launch?",                      h: "Fraud scoring, velocity checks, anomaly detection on card usage, recurring pen tests, bug bounty.",   dp: 2 }
      ]
    },

    {
      id: "ps3",
      ti: "Feature Flag Misconfiguration Exposes Beta",
      di: "beginner",
      xp: 200,
      tg: ["Feature Flags", "Access Control", "Misconfiguration"],
      es: "5-8 min",
      ar: ["Product Security"],
      de: "A feature flag system exposes an admin-only beta feature to all authenticated users due to a misconfigured boolean condition. The feature bypasses authorization checks.",
      no: [
        { id: "a", l: "User",        t: "user",    x: 20,  y: 60  },
        { id: "b", l: "Feature Flag",t: "policy",  x: 200, y: 30  },
        { id: "c", l: "Beta Feature",t: "api",     x: 380, y: 30  },
        { id: "d", l: "Admin Data",  t: "db",      x: 560, y: 60  }
      ],
      ed: [
        { f: "a", t: "b", l: "Authenticated",a: 1 },
        { f: "b", t: "c", l: "Flag = true",  a: 1 },
        { f: "c", t: "d", l: "No authz check",a:1 }
      ],
      ch: [
        { s: "Privilege Escalation",d: "Feature flag grants admin access to regular users",m: "T1548" },
        { s: "Collection",          d: "Unauthorized access to admin-only data",           m: "T1530" }
      ],
      po: [
        { id: "q1", ca: "Threat ID",    t: "Why are feature flags a security risk if not treated as an access control mechanism?",                              h: "Feature flags are often managed by product teams without security review and can bypass authz.",       dp: 1 },
        { id: "q2", ca: "Remediation",  t: "You discover the misconfiguration. What is your immediate response?",                                              h: "Disable flag immediately, audit usage logs, check for data access/modification, patch boolean check.", dp: 1 },
        { id: "q3", ca: "Architecture", t: "Design a secure feature flag system that integrates with your authorization framework.",                            h: "Tie flags to roles/permissions, not just user identity. Flag service integrated with authz layer.",   dp: 2 },
        { id: "q4", ca: "Prevention",   t: "What SDLC controls would prevent a feature flag misconfiguration from reaching production?",                        h: "Security review for flag configs, automated testing for authz bypass, staging parity with prod.",    dp: 2 },
        { id: "q5", ca: "Detection",    t: "How would you detect unauthorized feature flag access in production logs?",                                         h: "Audit logs for admin feature access by non-admin roles, anomaly detection on feature usage rates.",  dp: 1 }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 🏗️  SECURITY ARCHITECT (3 scenarios)
  // ─────────────────────────────────────────────────────────────
  secarch: [
    {
      id: "sa1",
      ti: "Zero Trust Migration for Legacy Enterprise",
      di: "expert",
      xp: 500,
      tg: ["Zero Trust", "Enterprise", "IAM", "Architecture"],
      es: "15-20 min",
      ar: ["Zero Trust", "Enterprise Architecture"],
      de: "A 5000-person enterprise needs to migrate from a castle-and-moat VPN architecture to Zero Trust. You are the security architect leading the 18-month transformation program.",
      no: [
        { id: "a", l: "Users",        t: "user",    x: 20,  y: 60  },
        { id: "b", l: "ZTNA Broker",  t: "vpn",     x: 200, y: 30  },
        { id: "c", l: "IdP/SSO",      t: "iam",     x: 200, y: 120 },
        { id: "d", l: "Policy Engine",t: "policy",  x: 380, y: 60  },
        { id: "e", l: "Microsegments",t: "network", x: 560, y: 30  },
        { id: "f", l: "SIEM/UEBA",    t: "siem",    x: 560, y: 120 }
      ],
      ed: [
        { f: "a", t: "b", l: "Device posture",  a: 1 },
        { f: "a", t: "c", l: "Identity verify", a: 1 },
        { f: "b", t: "d", l: "Policy eval",     a: 1 },
        { f: "c", t: "d", l: "Claims",          a: 1 },
        { f: "d", t: "e", l: "Allow/deny",      a: 1 },
        { f: "f", t: "d", l: "Risk signal",     a: 1 }
      ],
      ch: [
        { s: "Architecture Risk", d: "Implicit trust in flat network enables lateral movement",      m: "T1021" },
        { s: "Migration Risk",    d: "Big-bang migration causes business disruption",                m: "T1562" }
      ],
      po: [
        { id: "q1", ca: "Architecture",  t: "Define the 5 pillars of Zero Trust and map them to specific technology controls in your enterprise.",                  h: "Identity, Device, Network, Application, Data — each with specific vendor/control mappings.",          dp: 2 },
        { id: "q2", ca: "Roadmap",       t: "Design an 18-month Zero Trust migration roadmap that maintains business continuity throughout.",                       h: "Phased: identity foundation → device posture → app microsegmentation → data classification → UEBA.", dp: 3 },
        { id: "q3", ca: "Executive Buy-in",t:"Build the business case for Zero Trust investment to a CFO who sees it as a cost center.",                           h: "Breach cost reduction, cyber insurance savings, compliance posture, remote work enablement ROI.",    dp: 2 },
        { id: "q4", ca: "Technical Design",t:"Design the network microsegmentation strategy for 200 applications with varying sensitivity levels.",                h: "Data classification first, group by data flow, Illumio/NSX/AWS Security Groups, policy as code.",   dp: 3 },
        { id: "q5", ca: "Metrics",       t: "Define the KPIs and success metrics you would report to the CISO 90 days into the Zero Trust program.",              h: "Mean time to detect lateral movement, % apps behind identity-aware proxy, MFA adoption rate.",       dp: 3 }
      ]
    },

    {
      id: "sa2",
      ti: "M&A Security Architecture Assessment",
      di: "advanced",
      xp: 450,
      tg: ["M&A", "Risk Assessment", "Architecture"],
      es: "12-18 min",
      ar: ["Enterprise Architecture", "GRC"],
      de: "Your company is acquiring a 300-person SaaS startup. You have 30 days to complete a security architecture assessment before deal closure. The startup runs on AWS with a mix of modern and legacy services.",
      no: [
        { id: "a", l: "Acquiree",    t: "cloud",  x: 20,  y: 60  },
        { id: "b", l: "AWS Infra",   t: "compute",x: 200, y: 30  },
        { id: "c", l: "Legacy Apps", t: "endpoint",x:200, y: 120 },
        { id: "d", l: "Risk Model",  t: "policy", x: 380, y: 60  },
        { id: "e", l: "Corp Network",t: "network",x: 560, y: 60  }
      ],
      ed: [
        { f: "a", t: "b", l: "Cloud audit",    a: 1 },
        { f: "a", t: "c", l: "Legacy scan",    a: 1 },
        { f: "b", t: "d", l: "Risk findings",  a: 1 },
        { f: "c", t: "d", l: "Gap analysis",   a: 1 },
        { f: "d", t: "e", l: "Integration plan",a:1 }
      ],
      ch: [
        { s: "Assessment Risk",   d: "Unknown security posture introduces integration risk",   m: "T1595" },
        { s: "Integration Risk",  d: "Network integration exposes both environments",         m: "T1021"  }
      ],
      po: [
        { id: "q1", ca: "Assessment",   t: "What are the top 10 areas you assess in a 30-day M&A security due diligence review?",                              h: "IAM hygiene, patch posture, pen test history, DR testing, data classification, incident history.", dp: 2 },
        { id: "q2", ca: "Risk Model",   t: "How do you assign a risk score to the acquisition? What would be a deal-breaker finding?",                        h: "Quantified risk model, deal-breakers: active breach, regulatory violation, critical CVEs, no MFA.", dp: 2 },
        { id: "q3", ca: "Architecture", t: "Design the network integration architecture that segments the acquired company during an 18-month evaluation period.",h: "Isolated DMZ, federated identity with conditional access, no direct peering until remediation done.", dp: 3 },
        { id: "q4", ca: "Remediation",  t: "You found 45 critical AWS misconfigurations. How do you prioritize and remediate them in 60 days?",               h: "Risk score by blast radius × exploitability, automated remediation for IAM issues first.",          dp: 3 },
        { id: "q5", ca: "Integration",  t: "How do you handle employee identity integration while maintaining security during the transition period?",          h: "Federated SAML, separate identity pools with conditional access, deprovisioning on acquisition close.", dp: 2 }
      ]
    },

    {
      id: "sa3",
      ti: "Ransomware-Resilient Architecture Design",
      di: "expert",
      xp: 490,
      tg: ["Ransomware", "Resilience", "Backup", "Recovery"],
      es: "15-20 min",
      ar: ["Enterprise Architecture", "DFIR"],
      de: "Following a near-miss ransomware incident, the CISO tasks you with designing a ransomware-resilient enterprise architecture from scratch. Budget is approved, blank slate design.",
      no: [
        { id: "a", l: "Endpoints",   t: "endpoint",x: 20,  y: 60  },
        { id: "b", l: "EDR/XDR",     t: "monitor", x: 200, y: 20  },
        { id: "c", l: "Segmented Net",t:"network",  x: 200, y: 110 },
        { id: "d", l: "Immutable Backup",t:"vault", x: 380, y: 60  },
        { id: "e", l: "SIEM/SOAR",   t: "siem",    x: 560, y: 30  },
        { id: "f", l: "Recovery Env",t: "cloud",   x: 560, y: 110 }
      ],
      ed: [
        { f: "a", t: "b", l: "Telemetry",      a: 1 },
        { f: "a", t: "c", l: "Segmented",      a: 1 },
        { f: "c", t: "d", l: "Air-gap backup", a: 1 },
        { f: "b", t: "e", l: "Alerts",         a: 1 },
        { f: "e", t: "f", l: "Auto-recover",   a: 1 }
      ],
      ch: [
        { s: "Prevention",  d: "Minimize attack surface for ransomware delivery",  m: "T1486" },
        { s: "Resilience",  d: "Immutable backups prevent ransomware encryption",  m: "T1490" }
      ],
      po: [
        { id: "q1", ca: "Architecture",  t: "Design a 5-layer ransomware defense architecture. What controls exist at each layer?",                              h: "Email/web filtering, EDR, network segmentation, immutable backups, rapid recovery environment.",     dp: 2 },
        { id: "q2", ca: "Backup Design", t: "Design the backup and recovery architecture that guarantees RTO < 4 hours and RPO < 1 hour for critical systems.",  h: "3-2-1-1-0 backup rule, immutable S3 Object Lock, air-gapped tape, automated recovery runbooks.",     dp: 3 },
        { id: "q3", ca: "Segmentation",  t: "How do you design network segmentation that limits ransomware blast radius without breaking business workflows?",   h: "Crown jewel mapping, VLAN per business unit, unidirectional gateways for backups, jump servers.",   dp: 3 },
        { id: "q4", ca: "Detection",     t: "Design an early warning system that detects ransomware precursor activity (recon, staging) before encryption begins.",h:"Honey files, mass file rename detection, shadow copy deletion alerts, LSASS access patterns.",     dp: 3 },
        { id: "q5", ca: "Response Plan", t: "Write the first 24-hour incident response playbook for a confirmed ransomware outbreak.",                           h: "Hour 0: isolate, Hour 1: scope, Hour 2-4: eradicate, Hour 4-8: recover critical systems, IR comms.", dp: 2 }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 🔍  DFIR (3 scenarios)
  // ─────────────────────────────────────────────────────────────
  dfir: [
    {
      id: "df1",
      ti: "Active Ransomware Outbreak — Financial Sector",
      di: "expert",
      xp: 500,
      tg: ["Ransomware", "Incident Response", "Forensics"],
      es: "15-20 min",
      ar: ["DFIR", "Incident Response"],
      de: "Monday 6 AM. Helpdesk tickets exploding. File shares encrypted. Trading floor cannot function. You are the IR lead. Unknown ransomware variant, suspected LockBit affiliate.",
      no: [
        { id: "a", l: "Patient Zero",  t: "endpoint",x: 20,  y: 60  },
        { id: "b", l: "File Server",   t: "storage", x: 200, y: 30  },
        { id: "c", l: "AD Domain",     t: "ad",      x: 200, y: 120 },
        { id: "d", l: "Backup Server", t: "vault",   x: 380, y: 60  },
        { id: "e", l: "C2 Server",     t: "c2",      x: 560, y: 60  }
      ],
      ed: [
        { f: "a", t: "b", l: "Encrypt shares", a: 1 },
        { f: "a", t: "c", l: "DCSync attempt",  a: 1 },
        { f: "c", t: "d", l: "Delete backups",  a: 1 },
        { f: "a", t: "e", l: "C2 beacon",       a: 1 }
      ],
      ch: [
        { s: "Execution",    d: "Ransomware deployed via compromised admin credentials",  m: "T1486"     },
        { s: "Impact",       d: "File encryption on shared drives",                      m: "T1490"     },
        { s: "Defense Evasion",d:"Volume shadow copy deletion",                          m: "T1070.004" },
        { s: "C2",           d: "Beaconing to LockBit infrastructure",                  m: "T1071"     }
      ],
      po: [
        { id: "q1", ca: "First Response",   t: "It is 6:05 AM and ransomware is actively spreading. What are your first 5 actions in the next 15 minutes?",         h: "Isolate network segments, kill domain admin sessions, engage backup team, call CISO, preserve memory.", dp: 2 },
        { id: "q2", ca: "Forensics",        t: "How do you identify patient zero and the initial infection vector with minimal downtime disruption?",                  h: "EDR telemetry timeline, Windows Event Logs 4624/4625, prefetch files, MFT forensics.",               dp: 3 },
        { id: "q3", ca: "Scoping",          t: "Describe your methodology to determine the full scope of compromise across 2000 endpoints in 4 hours.",               h: "EDR bulk query, AD login history, network flow analysis, IOC sweep, honeypot check.",                  dp: 3 },
        { id: "q4", ca: "Recovery",         t: "Backups exist but may be compromised. How do you safely validate and use backups for recovery?",                      h: "Test restoration in isolated environment, scan for ransomware backdoors, validate against known-good hash.", dp: 3 },
        { id: "q5", ca: "Post-Incident",    t: "Write the lessons learned framework for this incident. What systemic failures will you address first?",               h: "No MFA on admin accounts, flat network, no immutable backups, inadequate monitoring of AD changes.",  dp: 2 }
      ]
    },

    {
      id: "df2",
      ti: "Insider Threat: Data Exfiltration Before Resignation",
      di: "advanced",
      xp: 420,
      tg: ["Insider Threat", "DLP", "Forensics"],
      es: "12-16 min",
      ar: ["DFIR", "Detection"],
      de: "HR flags that a senior engineer gave 2 weeks notice. DLP alerts fire showing 40GB uploaded to personal Google Drive in the past 72 hours. You are called to investigate.",
      no: [
        { id: "a", l: "Insider",     t: "user",    x: 20,  y: 60  },
        { id: "b", l: "Corp Laptop", t: "endpoint",x: 200, y: 30  },
        { id: "c", l: "Google Drive",t: "storage", x: 380, y: 30  },
        { id: "d", l: "Source Code", t: "db",      x: 200, y: 120 },
        { id: "e", l: "DLP System",  t: "monitor", x: 380, y: 120 }
      ],
      ed: [
        { f: "a", t: "b", l: "Use device",     a: 1 },
        { f: "b", t: "d", l: "Access repos",   a: 1 },
        { f: "b", t: "c", l: "Upload files",   a: 1 },
        { f: "e", t: "a", l: "Alert fired",    a: 1 }
      ],
      ch: [
        { s: "Collection",   d: "Bulk data access across source code, docs, customer data",  m: "T1005"     },
        { s: "Exfiltration", d: "Upload to personal cloud storage via browser",              m: "T1567.002" }
      ],
      po: [
        { id: "q1", ca: "Investigation",  t: "What data do you need to collect in the first hour to build a forensic timeline of the insider's activities?",         h: "DLP logs, browser history, USB events, GitHub clone/download logs, email attachments sent.",         dp: 2 },
        { id: "q2", ca: "Legal",          t: "What legal considerations govern how you handle and document evidence in an insider threat investigation?",             h: "Chain of custody, HR/Legal in loop, employee privacy laws by jurisdiction, admissibility standards.", dp: 2 },
        { id: "q3", ca: "Scope",          t: "Beyond the obvious data, what other exfiltration vectors would you investigate?",                                      h: "Screenshots, camera (Loom), printed documents, AirDrop, personal phone, git commits to forks.",     dp: 2 },
        { id: "q4", ca: "Architecture",   t: "Design an insider threat detection program that catches exfiltration while respecting employee privacy.",               h: "DLP with UEBA, time-limited elevated alerts for off-boarding employees, legal review of monitoring.", dp: 3 },
        { id: "q5", ca: "Prevention",     t: "What technical and process controls reduce insider threat risk for employees with access to sensitive IP?",             h: "Just-in-time access, need-to-know DLP policies, off-boarding checklist, honeypot files/tokens.",   dp: 3 }
      ]
    },

    {
      id: "df3",
      ti: "Memory Forensics: Fileless Malware",
      di: "expert",
      xp: 500,
      tg: ["Memory Forensics", "Fileless", "Malware Analysis"],
      es: "15-20 min",
      ar: ["DFIR", "Malware Analysis"],
      de: "EDR fires on a suspicious PowerShell process executing encoded commands. Disk scan finds nothing. Attacker is living off the land using LOLBins. Memory analysis required.",
      no: [
        { id: "a", l: "Attacker",     t: "threat",  x: 20,  y: 60  },
        { id: "b", l: "Phishing Doc", t: "endpoint",x: 180, y: 20  },
        { id: "c", l: "PowerShell",   t: "compute", x: 350, y: 60  },
        { id: "d", l: "Memory",       t: "vault",   x: 530, y: 30  },
        { id: "e", l: "C2 Channel",   t: "c2",      x: 530, y: 110 }
      ],
      ed: [
        { f: "a", t: "b", l: "Macro exec",      a: 1 },
        { f: "b", t: "c", l: "PowerShell spawn",a: 1 },
        { f: "c", t: "d", l: "Inject shellcode",a: 1 },
        { f: "d", t: "e", l: "Cobalt Strike",   a: 1 }
      ],
      ch: [
        { s: "Initial Access",   d: "Malicious Office macro triggers PowerShell",     m: "T1566.001" },
        { s: "Defense Evasion",  d: "Fileless execution leaves no disk artifacts",    m: "T1027"     },
        { s: "C2",               d: "Cobalt Strike beacon in memory",                m: "T1059.001" }
      ],
      po: [
        { id: "q1", ca: "Threat ID",  t: "What is fileless malware? Why does traditional AV fail to detect it? What does 'living off the land' mean?",             h: "No disk artifacts, uses LOLBins (certutil, regsvr32, mshta), abuses trusted processes, evades sigs.", dp: 2 },
        { id: "q2", ca: "Forensics",  t: "Walk through a memory forensics investigation using Volatility. What plugins would you run and what are you looking for?", h: "pslist/pstree, cmdline, malfind, netscan, dumpfiles, check for injected code in legitimate processes.", dp: 3 },
        { id: "q3", ca: "Evidence",   t: "PowerShell logging is disabled on the victim host. What other evidence sources can reconstruct the attack chain?",          h: "EDR telemetry, Windows Event Logs 4103/4104 if enabled, prefetch, Amcache, network flows.",           dp: 3 },
        { id: "q4", ca: "Detection",  t: "Design a detection strategy for fileless attacks that does not rely on file system scanning.",                              h: "Script block logging, AMSI integration, behavioral EDR (process creation, parent-child anomalies).", dp: 3 },
        { id: "q5", ca: "Architecture",t:"Harden the Windows environment to make fileless PowerShell attacks significantly harder to execute.",                      h: "Constrained Language Mode, WDAC policies, JEA, disable macro execution, AMSI, Windows Defender ATP.", dp: 3 }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 📋  GRC & COMPLIANCE (3 scenarios)
  // ─────────────────────────────────────────────────────────────
  grc: [
    {
      id: "gr1",
      ti: "SOC 2 Type II Audit Preparation",
      di: "intermediate",
      xp: 300,
      tg: ["SOC2", "Compliance", "Audit"],
      es: "10-14 min",
      ar: ["GRC", "Compliance"],
      de: "A Series B SaaS startup needs to pass its first SOC 2 Type II audit in 6 months. CTO tasks you with leading the compliance program. No formal security controls currently exist.",
      no: [
        { id: "a", l: "Auditor",     t: "user",   x: 20,  y: 60  },
        { id: "b", l: "Control Env", t: "policy", x: 200, y: 30  },
        { id: "c", l: "Evidence",    t: "db",     x: 380, y: 30  },
        { id: "d", l: "SOC 2 Report",t: "vault",  x: 560, y: 60  }
      ],
      ed: [
        { f: "a", t: "b", l: "Test controls",  a: 1 },
        { f: "b", t: "c", l: "Collect evidence",a:1 },
        { f: "c", t: "d", l: "Issue opinion",   a: 1 }
      ],
      ch: [
        { s: "Compliance Gap", d: "Missing controls against SOC 2 Trust Services Criteria",  m: "T1562" }
      ],
      po: [
        { id: "q1", ca: "GRC",           t: "What are the 5 Trust Services Criteria in SOC 2? Which are mandatory vs optional?",                                  h: "Security (mandatory), Availability, Confidentiality, Processing Integrity, Privacy (optional).",     dp: 1 },
        { id: "q2", ca: "Roadmap",       t: "Design a 6-month SOC 2 readiness roadmap for a startup with no prior compliance program.",                           h: "Month 1: gap assessment, Month 2-3: implement controls, Month 4-5: evidence collection, Month 6: audit.", dp: 2 },
        { id: "q3", ca: "Controls",      t: "What are the top 15 technical controls auditors check in a SOC 2 audit? How do you evidence each?",                  h: "MFA, encryption at rest/transit, access reviews, vulnerability scanning, logging, SDLC security.",    dp: 2 },
        { id: "q4", ca: "Risk",          t: "How do you perform a SOC 2 risk assessment that satisfies auditor requirements?",                                    h: "Asset inventory, threat catalog, likelihood × impact matrix, residual risk tracking, annual review.",  dp: 2 },
        { id: "q5", ca: "Continuous",   t: "After passing SOC 2, how do you maintain compliance as your product evolves rapidly?",                               h: "Compliance-as-code, automated control monitoring (Vanta/Drata), change management controls.",         dp: 2 }
      ]
    },

    {
      id: "gr2",
      ti: "GDPR Breach Notification Scenario",
      di: "advanced",
      xp: 380,
      tg: ["GDPR", "Privacy", "Breach Notification"],
      es: "12-16 min",
      ar: ["GRC", "Privacy", "Legal"],
      de: "A production database containing 500K EU user records (email, hashed passwords, location data) was exposed for 18 hours due to a misconfigured Elasticsearch cluster. You are the DPO.",
      no: [
        { id: "a", l: "Exposed DB",   t: "db",     x: 20,  y: 60  },
        { id: "b", l: "Unknown Access",t:"threat",  x: 200, y: 30  },
        { id: "c", l: "Legal Team",   t: "user",   x: 380, y: 30  },
        { id: "d", l: "Supervisory Auth",t:"policy",x: 560, y: 60  }
      ],
      ed: [
        { f: "a", t: "b", l: "18hr exposure", a: 1 },
        { f: "b", t: "c", l: "Breach reported",a:1 },
        { f: "c", t: "d", l: "72hr notify",   a: 1 }
      ],
      ch: [
        { s: "Data Breach",  d: "EU personal data exposed without authorization",   m: "T1530"     },
        { s: "Compliance",   d: "GDPR Articles 33 and 34 triggered",               m: "T1562"     }
      ],
      po: [
        { id: "q1", ca: "GDPR",          t: "What does GDPR Article 33 require and what is your 72-hour clock? When does it start?",                              h: "Notify supervisory authority within 72 hours of becoming aware. Clock starts on confirmed breach.",   dp: 1 },
        { id: "q2", ca: "DPA Notification",t:"Write the Article 33 breach notification to the supervisory authority. What must it contain?",                     h: "Nature of breach, DPO contact, approximate records affected, likely consequences, mitigation measures.", dp: 2 },
        { id: "q3", ca: "User Notification",t:"Does this breach require Article 34 user notification? How do you make that determination?",                      h: "High risk to data subjects (location + email = profiling risk). Yes, notification likely required.",   dp: 2 },
        { id: "q4", ca: "Remediation",   t: "Beyond GDPR notification, what technical and organizational measures do you implement post-breach?",                 h: "Root cause fix, access control review, penetration test, DPA with vendors, staff training.",           dp: 2 },
        { id: "q5", ca: "Program",       t: "Design a GDPR compliance program that prevents misconfigured databases from containing production EU data.",         h: "Data minimization, automated PII discovery, network access controls, mandatory encryption, DPIAs.",   dp: 3 }
      ]
    },

    {
      id: "gr3",
      ti: "PCI-DSS Level 1 Scope Reduction",
      di: "advanced",
      xp: 420,
      tg: ["PCI-DSS", "Compliance", "Scope", "Architecture"],
      es: "12-16 min",
      ar: ["GRC", "Security Architecture"],
      de: "Your e-commerce platform processes 10M+ card transactions per year (PCI-DSS Level 1). Upcoming QSA audit. Engineering wants to add a new payment feature that would dramatically increase your CDE scope.",
      no: [
        { id: "a", l: "Cardholder",  t: "user",   x: 20,  y: 60  },
        { id: "b", l: "Payment Page",t: "api",    x: 200, y: 30  },
        { id: "c", l: "CDE",         t: "vault",  x: 380, y: 60  },
        { id: "d", l: "Tokenization",t: "iam",    x: 200, y: 120 },
        { id: "e", l: "QSA Auditor", t: "monitor",x: 560, y: 60  }
      ],
      ed: [
        { f: "a", t: "b", l: "Card entry",    a: 1 },
        { f: "b", t: "d", l: "Tokenize",      a: 1 },
        { f: "d", t: "c", l: "Token only",    a: 1 },
        { f: "c", t: "e", l: "Audit scope",   a: 1 }
      ],
      ch: [
        { s: "Compliance Risk", d: "New feature expands CDE scope by 300%",               m: "T1562" },
        { s: "Architecture",    d: "Missing segmentation between CDE and non-CDE",       m: "T1021"  }
      ],
      po: [
        { id: "q1", ca: "PCI-DSS",       t: "Define the Cardholder Data Environment (CDE) and explain how network segmentation reduces PCI scope.",              h: "CDE = systems that store, process, transmit cardholder data. Segmentation removes non-CDE from scope.", dp: 1 },
        { id: "q2", ca: "Scope Analysis",t: "The new feature would triple your CDE. How do you architect it to minimize or eliminate scope expansion?",          h: "iFrame tokenization, client-side JS from PCI-compliant vendor (Stripe.js), never touch PANs in-house.", dp: 2 },
        { id: "q3", ca: "QSA Prep",      t: "What are the 12 PCI-DSS requirements? Which 3 do companies most commonly fail on Level 1 audits?",                 h: "Req 1 (network controls), Req 6 (vuln management/patching), Req 10 (logging) are most common failures.", dp: 2 },
        { id: "q4", ca: "Segmentation",  t: "Design the network segmentation architecture for your CDE that satisfies PCI-DSS Req 1.",                          h: "Dedicated VLAN, stateful firewall rules, DMZ for payment APIs, no direct internet access from CDE.",  dp: 3 },
        { id: "q5", ca: "Continuous",    t: "How do you maintain PCI-DSS compliance continuously between annual QSA audits?",                                   h: "Quarterly ASV scans, penetration test annually, vulnerability management program, change advisory board.", dp: 2 }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 📡  SOC ANALYST (3 scenarios)
  // ─────────────────────────────────────────────────────────────
  soc: [
    {
      id: "sc1",
      ti: "BEC: CEO Fraud Wire Transfer Alert",
      di: "intermediate",
      xp: 300,
      tg: ["BEC", "Phishing", "SIEM", "Alert Triage"],
      es: "10-14 min",
      ar: ["SOC Analysis", "Incident Response"],
      de: "SIEM fires: suspicious email from CEO lookalike domain requests urgent $480K wire transfer to a new vendor. Finance team has already been contacted. CFO is asking for guidance.",
      no: [
        { id: "a", l: "Attacker",     t: "threat",  x: 20,  y: 60  },
        { id: "b", l: "Spoof Email",  t: "api",     x: 200, y: 30  },
        { id: "c", l: "Finance User", t: "user",    x: 380, y: 30  },
        { id: "d", l: "SIEM Alert",   t: "siem",    x: 380, y: 120 },
        { id: "e", l: "Bank Wire",    t: "db",      x: 560, y: 60  }
      ],
      ed: [
        { f: "a", t: "b", l: "CEO spoof",      a: 1 },
        { f: "b", t: "c", l: "Urgent request", a: 1 },
        { f: "c", t: "e", l: "Wire initiated", a: 1 },
        { f: "d", t: "c", l: "SOC alert",      a: 1 }
      ],
      ch: [
        { s: "Initial Access",   d: "Lookalike domain registered, email sent",   m: "T1566.001" },
        { s: "Financial Fraud",  d: "Social engineering CFO for wire transfer",  m: "T1657"     }
      ],
      po: [
        { id: "q1", ca: "Triage",      t: "This SIEM alert came in 20 minutes ago. The wire hasn't been sent yet. What do you do in the next 5 minutes?",        h: "Contact finance immediately to halt wire, validate sender domain, check DMARC/SPF, call CFO directly.", dp: 1 },
        { id: "q2", ca: "Analysis",    t: "Walk through your email header analysis to confirm this is BEC and not a legitimate request.",                         h: "Reply-to address, sending IP vs SPF records, DKIM signature, Return-Path, lookalike domain check.",   dp: 1 },
        { id: "q3", ca: "Escalation",  t: "The wire was sent before the alert fired. What are your escalation steps and who do you contact?",                    h: "CISO, legal, finance team, FBI IC3, bank fraud team within 24 hours for possible reversal.",           dp: 2 },
        { id: "q4", ca: "Detection",   t: "Design a SIEM detection rule that catches BEC before the wire transfer occurs.",                                       h: "Lookalike domain regex, external emails with executive names, payment keywords + urgency terms.",       dp: 2 },
        { id: "q5", ca: "Prevention",  t: "What technical controls would have prevented this BEC attack?",                                                       h: "DMARC enforcement, email banners for external senders, out-of-band wire verification process.",        dp: 2 }
      ]
    },

    {
      id: "sc2",
      ti: "Cryptominer Outbreak — 200 Endpoints",
      di: "advanced",
      xp: 400,
      tg: ["Cryptominer", "SIEM", "Endpoint", "Threat Hunting"],
      es: "12-16 min",
      ar: ["SOC Analysis", "Threat Detection"],
      de: "SOC dashboard shows CPU utilization spike across 200 endpoints starting at 2 AM. Alert correlation shows outbound connections to known XMRig mining pools. HR says no maintenance was scheduled.",
      no: [
        { id: "a", l: "200 Endpoints",t: "endpoint",x: 20,  y: 60  },
        { id: "b", l: "SIEM",         t: "siem",    x: 200, y: 30  },
        { id: "c", l: "Mining Pool",  t: "c2",      x: 380, y: 60  },
        { id: "d", l: "Initial Vector",t:"threat",  x: 200, y: 120 }
      ],
      ed: [
        { f: "a", t: "b", l: "CPU alerts",      a: 1 },
        { f: "a", t: "c", l: "Outbound 3333",   a: 1 },
        { f: "d", t: "a", l: "Unknown initial",  a: 1 }
      ],
      ch: [
        { s: "Execution",  d: "Cryptominer deployed across multiple endpoints",  m: "T1496" },
        { s: "C2",         d: "Outbound mining pool connections",                m: "T1071" }
      ],
      po: [
        { id: "q1", ca: "Triage",         t: "200 endpoints are compromised. How do you triage this in the first 30 minutes without halting business operations?", h: "Identify common thread (AD OU, subnet, image), isolate subset, preserve evidence, identify IOCs.",    dp: 2 },
        { id: "q2", ca: "Hunt",           t: "Using SIEM and EDR, how do you trace the infection back to the initial compromise vector?",                         h: "Common parent process, first-seen timestamp, lateral movement source, correlate with VPN/RDP logs.", dp: 2 },
        { id: "q3", ca: "IOC Extraction", t: "What IOCs would you extract from this incident and share with your threat intelligence platform?",                   h: "Mining pool IPs/domains, miner binary hashes, scheduled task names, registry persistence keys.",     dp: 2 },
        { id: "q4", ca: "Detection",      t: "Write a SIEM use case that detects cryptominer activity with high fidelity and low false positives.",                h: "Known mining pool IPs + port 3333/4444, CPU > 80% sustained + unusual outbound, miner binary hashes.", dp: 3 },
        { id: "q5", ca: "Post-Incident",  t: "After eradication, how do you validate that no persistence mechanisms remain on the 200 endpoints?",                 h: "Scheduled task audit, autorun review, EDR full sweep, network monitoring for reinfection IOCs.",       dp: 2 }
      ]
    },

    {
      id: "sc3",
      ti: "Log4Shell Active Exploitation Triage",
      di: "beginner",
      xp: 220,
      tg: ["Log4Shell", "Vulnerability", "SIEM", "Triage"],
      es: "5-8 min",
      ar: ["SOC Analysis", "Vulnerability Response"],
      de: "December 2021 scenario. Log4Shell (CVE-2021-44228) just dropped. Your SIEM shows ${jndi:ldap://} patterns in web server logs. Management is asking if you are affected.",
      no: [
        { id: "a", l: "Attacker",     t: "threat",  x: 20,  y: 60  },
        { id: "b", l: "Web Server",   t: "compute", x: 200, y: 30  },
        { id: "c", l: "Log4j",        t: "api",     x: 380, y: 60  },
        { id: "d", l: "LDAP Server",  t: "c2",      x: 560, y: 30  }
      ],
      ed: [
        { f: "a", t: "b", l: "Malicious header", a: 1 },
        { f: "b", t: "c", l: "Log4j processes",  a: 1 },
        { f: "c", t: "d", l: "JNDI lookup",      a: 1 }
      ],
      ch: [
        { s: "Exploitation",  d: "JNDI injection via user-controlled input logged by Log4j",  m: "T1190"     },
        { s: "Execution",     d: "Remote class loading from attacker LDAP server",           m: "T1059"     }
      ],
      po: [
        { id: "q1", ca: "Threat ID",   t: "Explain how Log4Shell works in simple terms. What makes it so critical (CVSS 10.0)?",                               h: "Log4j logs user input and evaluates JNDI expressions. Attacker controls input = RCE. Zero-click.",   dp: 1 },
        { id: "q2", ca: "Triage",      t: "How do you rapidly determine if your organization is vulnerable to Log4Shell?",                                    h: "Asset inventory scan, SBOM review, search for log4j-core JAR files, runtime detection tools.",       dp: 1 },
        { id: "q3", ca: "Detection",   t: "What SIEM query would you write to detect Log4Shell exploitation attempts in your web logs?",                      h: "Search for ${jndi:, ${${::-j}, ${${lower:j} obfuscation variants in request headers/body.",          dp: 1 },
        { id: "q4", ca: "Remediation", t: "You have 50 Java applications. How do you prioritize and patch them within 48 hours?",                             h: "Exploit surface first (internet-facing), update Log4j to 2.17.1+, WAF virtual patching for others.", dp: 2 },
        { id: "q5", ca: "Prevention",  t: "What software composition analysis controls would have allowed faster response to Log4Shell?",                      h: "SBOM for all apps, SCA in CI pipeline (OWASP DC), vulnerability feeds, automated patching workflows.", dp: 2 }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 🎯  THREAT HUNTER (3 scenarios)
  // ─────────────────────────────────────────────────────────────
  threat: [
    {
      id: "th1",
      ti: "Hypothesis-Driven Hunt: APT Persistence",
      di: "expert",
      xp: 500,
      tg: ["APT", "Persistence", "Threat Hunting", "MITRE ATT&CK"],
      es: "15-20 min",
      ar: ["Threat Hunting", "Detection Engineering"],
      de: "Threat intel report: APT41 actively targeting your industry using scheduled tasks and WMI subscriptions for persistence. No active alerts. You must hunt proactively.",
      no: [
        { id: "a", l: "APT41",       t: "threat",  x: 20,  y: 60  },
        { id: "b", l: "Endpoints",   t: "endpoint",x: 200, y: 30  },
        { id: "c", l: "SIEM",        t: "siem",    x: 380, y: 60  },
        { id: "d", l: "EDR",         t: "monitor", x: 200, y: 120 },
        { id: "e", l: "Threat Intel",t: "db",      x: 560, y: 60  }
      ],
      ed: [
        { f: "a", t: "b", l: "Persistence",   a: 1 },
        { f: "b", t: "d", l: "Telemetry",     a: 1 },
        { f: "d", t: "c", l: "Log forward",   a: 1 },
        { f: "e", t: "c", l: "Intel enrich",  a: 1 }
      ],
      ch: [
        { s: "Persistence", d: "Scheduled tasks and WMI subscriptions for APT persistence", m: "T1053.005" },
        { s: "Defense Evasion",d:"Blends with legitimate Windows management activity",      m: "T1036"      }
      ],
      po: [
        { id: "q1", ca: "Hypothesis",   t: "Write a structured threat hunting hypothesis for APT41 WMI persistence using the PEAK framework.",                  h: "Hypothesis: APT41 has established WMI event subscriptions on internet-facing Windows servers.",       dp: 2 },
        { id: "q2", ca: "Data Sources", t: "What data sources do you need for this hunt and how do you validate they have sufficient coverage?",                 h: "Windows Event Logs 4698 (sched task), WMI activity log, EDR telemetry, Sysmon Event ID 19/20/21.",   dp: 2 },
        { id: "q3", ca: "Query",        t: "Write the SIEM/KQL/SPL query for detecting suspicious WMI subscriptions created within the last 30 days.",           h: "Query CommandLineEventConsumer, filter known-good, baseline against prior 90 days, enrich with intel.", dp: 3 },
        { id: "q4", ca: "Analysis",     t: "You find 3 suspicious WMI subscriptions. How do you determine if they are APT41 or legitimate admin activity?",      h: "Correlate with login events, check creator account, compare with APT41 TTPs from threat intel report.", dp: 3 },
        { id: "q5", ca: "Outcome",      t: "How do you operationalize successful hunt findings into permanent detections?",                                      h: "Convert hunt query to detection rule, tune FP rate, add to SOC playbook, feed back into threat intel.", dp: 3 }
      ]
    },

    {
      id: "th2",
      ti: "Hunting Living-Off-the-Land Binaries (LOLBins)",
      di: "advanced",
      xp: 440,
      tg: ["LOLBins", "Defense Evasion", "Hunting"],
      es: "12-16 min",
      ar: ["Threat Hunting", "Detection Engineering"],
      de: "Intelligence suggests attackers may be using LOLBins (certutil, mshta, regsvr32) for payload delivery and execution. You need to hunt for abuse across 5000 endpoints.",
      no: [
        { id: "a", l: "Attacker",     t: "threat",  x: 20,  y: 60  },
        { id: "b", l: "certutil.exe", t: "compute", x: 200, y: 20  },
        { id: "c", l: "regsvr32.exe", t: "compute", x: 200, y: 80  },
        { id: "d", l: "mshta.exe",    t: "compute", x: 200, y: 140 },
        { id: "e", l: "C2 Payload",   t: "c2",      x: 400, y: 80  }
      ],
      ed: [
        { f: "a", t: "b", l: "certutil abuse", a: 1 },
        { f: "a", t: "c", l: "Squiblydoo",     a: 1 },
        { f: "a", t: "d", l: "HTA exec",       a: 1 },
        { f: "b", t: "e", l: "Download exec",  a: 1 }
      ],
      ch: [
        { s: "Defense Evasion",d: "LOLBins bypass application whitelisting",     m: "T1218"     },
        { s: "Execution",      d: "Payload executed via trusted Windows binary",  m: "T1059.003" }
      ],
      po: [
        { id: "q1", ca: "LOLBins",      t: "What are LOLBins? List 5 commonly abused binaries and their abuse method.",                                         h: "certutil (download), mshta (HTA exec), regsvr32 (Squiblydoo), rundll32, msiexec, wmic.",             dp: 1 },
        { id: "q2", ca: "Baselining",   t: "How do you create a legitimate-use baseline for certutil.exe to reduce false positives in your hunt?",              h: "Analyze 90 days of usage, identify legitimate arguments (-encode, -decode), flag outbound connections.", dp: 2 },
        { id: "q3", ca: "Hunt Query",   t: "Write a hunt query for certutil.exe being used to download files from the internet.",                               h: "Process creation logs: certutil.exe with -urlcache or -split and http:// arguments in command line.", dp: 2 },
        { id: "q4", ca: "Correlation",  t: "You find suspicious certutil usage on 12 endpoints. How do you correlate to determine if it is the same actor?",    h: "Compare download URLs, timing patterns, parent process, user account, network destination IPs.",       dp: 3 },
        { id: "q5", ca: "Detection",    t: "Convert your LOLBin hunt findings into a detection rule that would catch this technique going forward.",             h: "Specific cmdline regex, outbound network from LOLBin processes, parent-child process anomaly rules.",  dp: 3 }
      ]
    },

    {
      id: "th3",
      ti: "Kerberoasting Hunt in Active Directory",
      di: "expert",
      xp: 490,
      tg: ["Kerberoasting", "Active Directory", "Hunting", "IAM"],
      es: "15-20 min",
      ar: ["Threat Hunting", "IAM", "Windows Security"],
      de: "Threat intel indicates a red team or threat actor may be performing Kerberoasting against your AD environment to harvest service account password hashes offline.",
      no: [
        { id: "a", l: "Attacker",    t: "threat",  x: 20,  y: 60  },
        { id: "b", l: "Domain User", t: "user",    x: 200, y: 20  },
        { id: "c", l: "KDC / AD",    t: "ad",      x: 380, y: 60  },
        { id: "d", l: "TGS Ticket",  t: "iam",     x: 560, y: 30  },
        { id: "e", l: "Offline Crack",t:"threat",  x: 560, y: 110 }
      ],
      ed: [
        { f: "a", t: "b", l: "Use account",    a: 1 },
        { f: "b", t: "c", l: "TGS-REQ (RC4)",  a: 1 },
        { f: "c", t: "d", l: "Encrypted TGS",  a: 1 },
        { f: "d", t: "e", l: "Crack offline",  a: 1 }
      ],
      ch: [
        { s: "Credential Access", d: "Request TGS tickets for SPN-linked accounts",          m: "T1558.003" },
        { s: "Defense Evasion",   d: "Offline cracking leaves no authentication events",     m: "T1550.003" }
      ],
      po: [
        { id: "q1", ca: "Threat ID",   t: "Explain how Kerberoasting works. Why is it only detectable during the request phase and not the cracking phase?",        h: "Any domain user can request TGS. RC4 encryption (NTLM) is crackable. Cracking is fully offline.",    dp: 2 },
        { id: "q2", ca: "Hunt Query",  t: "Write the AD event log query to detect potential Kerberoasting activity.",                                              h: "Event 4769 with RC4 (0x17) encryption type, filter service accounts with SPNs, high volume queries.", dp: 2 },
        { id: "q3", ca: "Baselining",  t: "How do you distinguish Kerberoasting from legitimate TGS requests in your environment?",                               h: "Baseline requestor accounts, RC4 vs AES usage patterns, timing anomalies, volume from single source.", dp: 3 },
        { id: "q4", ca: "Hardening",   t: "How do you harden service accounts against Kerberoasting without breaking the applications that depend on them?",       h: "Set AES-only encryption, implement Group Managed Service Accounts (gMSA), 25+ char random passwords.", dp: 3 },
        { id: "q5", ca: "Detection",   t: "Design a honeypot strategy that uses fake SPNs to reliably detect Kerberoasting with zero false positives.",            h: "Create honey accounts with SPNs, alert immediately on any TGS request, accounts never used legitimately.", dp: 3 }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 🔴  RED TEAM (3 scenarios)
  // ─────────────────────────────────────────────────────────────
  red: [
    {
      id: "rt1",
      ti: "Full-Scope Red Team: Financial Institution",
      di: "expert",
      xp: 500,
      tg: ["Red Team", "Social Engineering", "Physical Security", "APT Simulation"],
      es: "15-20 min",
      ar: ["Red Team", "Adversary Simulation"],
      de: "You are leading a full-scope red team engagement against a Tier 1 financial institution. Scope includes physical access, social engineering, network, and cloud. Goal: access trading systems.",
      no: [
        { id: "a", l: "Red Team",    t: "threat",  x: 20,  y: 60  },
        { id: "b", l: "Phishing",    t: "api",     x: 200, y: 20  },
        { id: "c", l: "Physical",    t: "endpoint",x: 200, y: 110 },
        { id: "d", l: "Corp Network",t: "network", x: 380, y: 60  },
        { id: "e", l: "AD / PAM",    t: "pam",     x: 560, y: 30  },
        { id: "f", l: "Trading Sys", t: "db",      x: 560, y: 110 }
      ],
      ed: [
        { f: "a", t: "b", l: "Spearphish",   a: 1 },
        { f: "a", t: "c", l: "Badge clone",  a: 1 },
        { f: "b", t: "d", l: "Foothold",     a: 1 },
        { f: "c", t: "d", l: "Physical foothold",a:1 },
        { f: "d", t: "e", l: "Priv esc",     a: 1 },
        { f: "e", t: "f", l: "Objective",    a: 1 }
      ],
      ch: [
        { s: "Initial Access",     d: "Spearphishing and physical social engineering",   m: "T1566.001" },
        { s: "Privilege Escalation",d:"AD privilege escalation via Kerberoasting",       m: "T1558.003" },
        { s: "Lateral Movement",   d: "Pivot from foothold to trading network segment",  m: "T1021.002" },
        { s: "Objective",          d: "Access trading systems to demonstrate impact",    m: "T1530"     }
      ],
      po: [
        { id: "q1", ca: "Planning",      t: "How do you structure the rules of engagement and scope documentation for a full-scope red team engagement?",           h: "Written authorization, out-of-scope systems list, emergency stop contacts, evidence handling, reporting.", dp: 2 },
        { id: "q2", ca: "Recon",         t: "Describe your OSINT methodology for this financial institution before touching any systems.",                          h: "LinkedIn org chart, job postings (tech stack), WHOIS, Shodan, DNS enumeration, supply chain vendors.", dp: 2 },
        { id: "q3", ca: "Initial Access",t: "Design a spearphishing campaign targeting a finance analyst. What makes it highly effective?",                        h: "OSINT-derived personal details, pretext matching their role, domain typosquatting, signed PDF lure.",  dp: 3 },
        { id: "q4", ca: "Escalation",    t: "You have a low-priv foothold. Walk through your methodology to reach Domain Admin.",                                  h: "BloodHound attack path analysis, Kerberoasting, ACL abuse, AS-REP roasting, token impersonation.",    dp: 3 },
        { id: "q5", ca: "Reporting",     t: "How do you write a red team report that drives remediation action rather than being filed away?",                      h: "Executive narrative, risk-ranked findings with business impact, specific remediation steps, retest plan.", dp: 2 }
      ]
    },

    {
      id: "rt2",
      ti: "Cloud Penetration Test: AWS Environment",
      di: "advanced",
      xp: 440,
      tg: ["Cloud Pen Test", "AWS", "IAM", "Privilege Escalation"],
      es: "12-16 min",
      ar: ["Red Team", "Cloud Security"],
      de: "You are performing an assumed-breach AWS penetration test. You start with credentials for a low-privilege developer IAM user and must demonstrate the maximum achievable blast radius.",
      no: [
        { id: "a", l: "Dev IAM User",t: "iam",    x: 20,  y: 60  },
        { id: "b", l: "IAM Enum",    t: "monitor",x: 200, y: 20  },
        { id: "c", l: "PassRole",    t: "iam",    x: 380, y: 20  },
        { id: "d", l: "Lambda",      t: "lambda", x: 380, y: 110 },
        { id: "e", l: "Admin Access",t: "vault",  x: 560, y: 60  }
      ],
      ed: [
        { f: "a", t: "b", l: "iam:List*",         a: 1 },
        { f: "b", t: "c", l: "PassRole found",    a: 1 },
        { f: "c", t: "d", l: "Create function",   a: 1 },
        { f: "d", t: "e", l: "Admin role assumed",a: 1 }
      ],
      ch: [
        { s: "Discovery",          d: "Enumerate IAM permissions and roles",                 m: "T1087.004" },
        { s: "Privilege Escalation",d:"iam:PassRole to create Lambda with admin role",       m: "T1098.001" },
        { s: "Execution",          d: "Lambda executes with admin IAM role",                m: "T1648"     }
      ],
      po: [
        { id: "q1", ca: "IAM Enum",      t: "Starting with low-priv IAM credentials, what is your enumeration methodology to identify privilege escalation paths?",h: "aws iam list-attached-user-policies, get-policy-version, enumerate roles you can assume, use Pacu.", dp: 2 },
        { id: "q2", ca: "PrivEsc",       t: "Explain the iam:PassRole privilege escalation vector. How does it lead to full admin access?",                       h: "PassRole lets you assign any role to a service. Create Lambda with admin role → execute with admin.", dp: 2 },
        { id: "q3", ca: "Attack Chain",  t: "You have achieved admin. Demonstrate 3 different high-impact attack paths from this position.",                       h: "Exfiltrate S3/RDS, create persistent IAM backdoor, disable CloudTrail, access Secrets Manager.",     dp: 3 },
        { id: "q4", ca: "Stealth",       t: "How do you conduct an AWS pen test while minimizing detection by CloudTrail-based alerting?",                        h: "Read-only first, avoid known noisy APIs, use assumed roles, operate outside business hours.",         dp: 3 },
        { id: "q5", ca: "Remediation",   t: "Based on your findings, write the top 5 remediation items for the AWS IAM configuration.",                           h: "Remove iam:PassRole from non-admin users, enable permission boundaries, SCP guardrails, IAM Access Analyzer.", dp: 2 }
      ]
    },

    {
      id: "rt3",
      ti: "Social Engineering: Vishing Campaign",
      di: "intermediate",
      xp: 320,
      tg: ["Social Engineering", "Vishing", "Human Factor"],
      es: "10-14 min",
      ar: ["Red Team", "Social Engineering"],
      de: "A company has strong technical defenses but employees lack security awareness. You are executing a vishing (voice phishing) campaign targeting IT helpdesk to gain initial access credentials.",
      no: [
        { id: "a", l: "Red Teamer",  t: "threat",  x: 20,  y: 60  },
        { id: "b", l: "IT Helpdesk", t: "user",    x: 200, y: 30  },
        { id: "c", l: "AD Account",  t: "iam",     x: 380, y: 60  },
        { id: "d", l: "Corp Systems",t: "compute", x: 560, y: 60  }
      ],
      ed: [
        { f: "a", t: "b", l: "Phone call",     a: 1 },
        { f: "b", t: "c", l: "Reset password", a: 1 },
        { f: "c", t: "d", l: "Attacker logs in",a:1 }
      ],
      ch: [
        { s: "Initial Access",  d: "Helpdesk manipulated into resetting credentials",   m: "T1078"     },
        { s: "Social Eng",      d: "Pretexting as authority figure bypasses procedure", m: "T1566"     }
      ],
      po: [
        { id: "q1", ca: "Social Eng",   t: "What psychological principles make vishing attacks against helpdesks particularly effective?",                          h: "Authority (impersonating exec/vendor), urgency (system down), liking (friendly tone), social proof.", dp: 1 },
        { id: "q2", ca: "Pretext",      t: "Design a vishing pretext script targeting an IT helpdesk to reset an executive's MFA.",                               h: "Executive travel emergency, CTO name from LinkedIn, spoofed caller ID, knowledge of internal systems.", dp: 2 },
        { id: "q3", ca: "Controls",     t: "What verification procedure should a helpdesk use to prevent social engineering? What is the attacker's counter?",     h: "Callback to employee's known number, manager verification, identity proofing code. Attacker: impersonate manager too.", dp: 2 },
        { id: "q4", ca: "Training",     t: "Design a security awareness training program that makes helpdesk staff resilient to vishing attacks.",                  h: "Scenario-based training, simulated vishing exercises, culture of challenge verification, blameless reporting.", dp: 2 },
        { id: "q5", ca: "Architecture", t: "What technical controls can supplement human awareness to prevent credential reset social engineering?",                h: "Hardware MFA that can't be reset by helpdesk, privileged access workflows, 24hr cooling off period.", dp: 3 }
      ]
    }
  ],

  // ─────────────────────────────────────────────────────────────
  // 🔵  BLUE TEAM (3 scenarios)
  // ─────────────────────────────────────────────────────────────
  blue: [
    {
      id: "bt1",
      ti: "Detection Engineering: SOAR Playbook for Phishing",
      di: "intermediate",
      xp: 300,
      tg: ["Detection Engineering", "SOAR", "Automation"],
      es: "10-14 min",
      ar: ["Detection Engineering", "SOAR"],
      de: "Your SOC receives 500 phishing alerts per day. Analysts are overwhelmed. You are tasked with building a SOAR playbook that automates triage and response, reducing manual effort by 80%.",
      no: [
        { id: "a", l: "Phishing Email",t:"api",     x: 20,  y: 60  },
        { id: "b", l: "Email Gateway", t: "waf",    x: 200, y: 30  },
        { id: "c", l: "SIEM Alert",    t: "siem",   x: 380, y: 60  },
        { id: "d", l: "SOAR Playbook", t: "monitor",x: 560, y: 30  },
        { id: "e", l: "Auto-Remediate",t: "policy", x: 560, y: 110 }
      ],
      ed: [
        { f: "a", t: "b", l: "Blocked/passed",a: 1 },
        { f: "b", t: "c", l: "Alert fired",   a: 1 },
        { f: "c", t: "d", l: "Trigger",       a: 1 },
        { f: "d", t: "e", l: "Automated resp",a: 1 }
      ],
      ch: [
        { s: "Detection",    d: "Phishing email triggers email gateway alert",         m: "T1566.001" },
        { s: "Response",     d: "Manual triage overwhelms SOC capacity",               m: "T1562"     }
      ],
      po: [
        { id: "q1", ca: "Design",       t: "Design the decision tree for your SOAR phishing triage playbook. What data do you enrich and what actions can it take automatically?",  h: "URL reputation, domain age, attachment sandbox, sender SPF/DKIM, auto-delete if high confidence.", dp: 2 },
        { id: "q2", ca: "Automation",   t: "Which phishing response actions should be fully automated vs require human approval? Why?",                                             h: "Auto: URL blocking, attachment quarantine. Human: credential reset, account isolation, user comms.", dp: 2 },
        { id: "q3", ca: "Metrics",      t: "How do you measure the success of your SOAR playbook? What metrics matter to the CISO?",                                               h: "MTTD, MTTR, automation rate, false positive rate, analyst hours saved, credential theft rate.",      dp: 2 },
        { id: "q4", ca: "False Positives",t:"A legitimate vendor email is being auto-deleted by the playbook. How do you handle FP without weakening detection?",                  h: "Allowlist by domain+DKIM, confidence scoring, staged automation, analyst feedback loop.",           dp: 2 },
        { id: "q5", ca: "Advanced",     t: "How would you extend this playbook to handle Business Email Compromise (BEC) scenarios that have no malicious attachments?",          h: "Lookalike domain detection, executive name spoofing rules, reply-to mismatch, payment keywords.",   dp: 3 }
      ]
    },

    {
      id: "bt2",
      ti: "Purple Team Exercise: Cobalt Strike Detection",
      di: "advanced",
      xp: 430,
      tg: ["Purple Team", "Cobalt Strike", "Detection Engineering"],
      es: "12-16 min",
      ar: ["Detection Engineering", "Blue Team"],
      de: "Your red team uses Cobalt Strike in all engagements but your SIEM detection rate is <30%. You are running a purple team exercise to improve detection coverage for CS beacons and post-exploitation.",
      no: [
        { id: "a", l: "CS Beacon",    t: "threat",  x: 20,  y: 60  },
        { id: "b", l: "Victim Host",  t: "endpoint",x: 200, y: 30  },
        { id: "c", l: "C2 Server",    t: "c2",      x: 380, y: 60  },
        { id: "d", l: "SIEM",         t: "siem",    x: 560, y: 30  },
        { id: "e", l: "Detection Gap",t: "monitor", x: 560, y: 110 }
      ],
      ed: [
        { f: "a", t: "b", l: "Inject beacon",  a: 1 },
        { f: "b", t: "c", l: "HTTP/HTTPS C2",  a: 1 },
        { f: "b", t: "d", l: "EDR telemetry",  a: 1 },
        { f: "d", t: "e", l: "Missed detections",a:1 }
      ],
      ch: [
        { s: "C2",            d: "Cobalt Strike HTTPS beacon with malleable profile",    m: "T1071.001" },
        { s: "Defense Evasion",d:"Process injection into legitimate process",            m: "T1055"     },
        { s: "Execution",     d: "PowerShell post-exploitation modules",                 m: "T1059.001" }
      ],
      po: [
        { id: "q1", ca: "Purple Team", t: "What is the purple team methodology? How does it differ from red/blue working separately?",                              h: "Collaborative: red executes TTPs, blue observes telemetry gaps in real-time, immediate feedback loop.", dp: 1 },
        { id: "q2", ca: "CS Detection",t: "What are the key behavioral indicators of a default Cobalt Strike beacon that survive profile changes?",                 h: "Parent-child process anomalies, shellcode injection patterns, memory artifacts, C2 jitter timing.",   dp: 2 },
        { id: "q3", ca: "SIEM Rules",  t: "Write detection logic for Cobalt Strike process injection into explorer.exe.",                                           h: "Sysmon Event 8 (CreateRemoteThread into explorer), unusual explorer network connections, RWX memory.", dp: 3 },
        { id: "q4", ca: "Coverage",    t: "How do you use MITRE ATT&CK to map your current detection coverage and identify the highest-priority gaps?",             h: "ATT&CK Navigator heatmap, score each technique by coverage, prioritize by threat actor frequency.",   dp: 3 },
        { id: "q5", ca: "Hardening",   t: "Beyond detection, what host hardening reduces Cobalt Strike effectiveness without breaking business operations?",        h: "WDAC for signed code, Credential Guard, disabling legacy protocols, application control.",            dp: 3 }
      ]
    },

    {
      id: "bt3",
      ti: "Cloud Detection Engineering: AWS Threat Detection",
      di: "advanced",
      xp: 420,
      tg: ["AWS", "Detection Engineering", "CloudTrail", "SIEM"],
      es: "12-16 min",
      ar: ["Detection Engineering", "Cloud Security"],
      de: "Your AWS estate generates 10M CloudTrail events per day. Coverage is minimal. You must build a scalable cloud detection engineering program that catches real threats without alert fatigue.",
      no: [
        { id: "a", l: "Threat Actor", t: "threat",  x: 20,  y: 60  },
        { id: "b", l: "CloudTrail",   t: "monitor", x: 200, y: 30  },
        { id: "c", l: "S3 / CW Logs", t: "storage", x: 380, y: 30  },
        { id: "d", l: "SIEM",         t: "siem",    x: 560, y: 60  },
        { id: "e", l: "SOAR",         t: "policy",  x: 380, y: 120 }
      ],
      ed: [
        { f: "a", t: "b", l: "API calls",         a: 1 },
        { f: "b", t: "c", l: "Events logged",     a: 1 },
        { f: "c", t: "d", l: "Query/alert",       a: 1 },
        { f: "d", t: "e", l: "Auto-respond",      a: 1 }
      ],
      ch: [
        { s: "Detection Gap",  d: "10M events/day creates alert fatigue or blind spots",  m: "T1562" },
        { s: "Coverage",       d: "Critical attack phases missing CloudTrail detections", m: "T1078"  }
      ],
      po: [
        { id: "q1", ca: "Architecture",  t: "Design a scalable cloud detection architecture for AWS that handles 10M events/day without overwhelming the SIEM.",    h: "Tiered: real-time streaming (Kinesis → Lambda for high-priority), batch (Athena) for threat hunting.", dp: 2 },
        { id: "q2", ca: "Priority Rules",t: "What are the top 10 CloudTrail-based detection rules every AWS environment should have?",                               h: "Root login, no-MFA console access, security group 0.0.0.0/0, CloudTrail disabled, key creation.",   dp: 2 },
        { id: "q3", ca: "Tuning",        t: "Your AssumeRole detection fires 200 times per day. 195 are false positives. Walk through your tuning methodology.",   h: "Baseline legitimate role assumptions, exclude known automation, add context (time, IP, user agent).", dp: 2 },
        { id: "q4", ca: "Detection Rule",t: "Write a detection rule for a compromised IAM key being used from a new geographic location.",                          h: "Correlate IP geolocation to historical login patterns, trigger on >500km deviation from baseline.",   dp: 3 },
        { id: "q5", ca: "Coverage Map",  t: "Use MITRE ATT&CK Cloud matrix to identify your top 3 detection gaps and propose rules for each.",                      h: "T1537 (S3 exfil to external), T1098 (IAM backdoor), T1553 (disable CloudTrail) — high impact gaps.", dp: 3 }
      ]
    }
  ]
};

/* ═══════════════════════════════════════════════════════════════
   USAGE INSTRUCTIONS
   ═══════════════════════════════════════════════════════════════

   OPTION A — Direct replacement (no bundler):
   ------------------------------------------
   1. Open cyberprep-v4-complete.jsx
   2. Find the line: const SCENARIOS = { cloud: [...], devsecops: [...], appsec: [...] };
      (starts around line 73, ends around line 105)
   3. Replace that entire block with the SCENARIOS object from this file
   4. Remove the line: ["netsec","prodsec","secarch","dfir","grc","soc","threat","red","blue"].forEach(...)

   OPTION B — ES Module import (recommended for VS Code setup):
   -----------------------------------------------------------
   1. Add this line at the top of cyberprep-v4-complete.jsx:
      import { SCENARIOS } from './cyberprep-database.js';
   2. Remove the original SCENARIOS const and the forEach placeholder line
   3. Both files must be in the same directory

   STATS:
   - 12 roles covered
   - 36 scenarios total (3 per role)
   - 180 questions (5 per scenario)
   - Difficulty spread: 4 beginner, 8 intermediate, 14 advanced, 10 expert
   - XP range: 200 (beginner) → 500 (expert)
   ═══════════════════════════════════════════════════════════════ */

# Natural Language Flow System

## 📋 What are Flows?

Flows are files that describe business processes and application logic in **natural language**. You don't need to know how to program to create flows!

## 🎯 What are they for?

- **Document** business processes clearly
- **Communicate** complex logic to the entire team
- **Generate** TypeScript reference code automatically
- **Keep** documentation always updated with the code

## 📁 Directory Structure

```
flows/
├── auth/               # Login, logout, password recovery flows
├── records/            # Entity CRUD flows
├── validations/        # Data validation flows
├── notifications/      # Notification sending flows
├── generated/          # Auto-generated code from flows
└── README.md           # This file
```

## ✍️ How to Create a Flow

### 1. Create a `.flow` file

Example: `flows/notifications/my-flow.flow`

### 2. Add Metadata

```yaml
---
name: Name of My Flow
category: notifications
version: 1.0.0
description: Brief description of what the flow does
author: Your Name
date: 2025-12-27
---
```

### 3. Describe the Context

```markdown
## Context
Explain here when and why this flow is executed.
Describe the business scenario.
```

### 4. List the Steps

```markdown
## Flow Steps

### 1. [First Step Name]
**When:** Describe when this step happens
**Action:** 
- What the system should do
- Can have multiple actions
**Expected Result:** 
- What should happen at the end
- What is the expected state

### 2. [Second Step Name]
**When:** ...
**Action:** ...
**Expected Result:** ...
```

### 5. Add Validations (optional)

```markdown
## Necessary Validations

### Data Validation
- Field X must be mandatory
- Field Y must have format Z
```

### 6. Describe Error Cases (optional)

```markdown
## Error Cases

### Upload Error
**If:** Upload fails
**Then:** 
- Display error message
- Keep previous data
```

## 🔄 How to Convert to Code

### Option 1: Use the Converter

```typescript
import { parseFlowContent, generateTypeScriptReference } from '@/utils/flowConverter';

const flowContent = await readFile('flows/notifications/my-flow.flow');
const flow = parseFlowContent(flowContent);
const code = generateTypeScriptReference(flow);
```

### Option 2: Use as Manual Reference

1. Open the `.flow` file
2. Read the described steps
3. Implement each step in your code
4. Use flow comments as documentation

## 📝 Full Example

See the [`change-profile-photo.flow`](file:///d:/AG/Siges/flows/notifications/change-profile-photo.flow) file for a full example of how to write a flow.

## 🎨 Best Practices

### ✅ Do

- Use clear and objective language
- Describe ALL steps, even the obvious ones
- Include validations and error cases
- Keep flows updated
- Use infinitive verbs (e.g., "Validate", "Create", "Send")

### ❌ Avoid

- Using unnecessary technical terms
- Skipping important steps
- Leaving information implicit
- Mixing multiple flows in one file
- Using code or programming syntax

## 🔍 Available Categories

| Category | Description | Examples |
|-----------|-----------|----------|
| `auth` | Login, logout, password recovery | Login with email, Password reset |
| `records` | Entity CRUD | Create contract, Edit unit |
| `validations` | Data validation | Validate dates, Validate documents |
| `notifications` | Sending notifications | Notify admin, Alert user |

## 🚀 Next Steps

1. **Create your first flow** following this guide
2. **Use as reference** when implementing features
3. **Share** with the team for review
4. **Update** whenever the logic changes

## 💡 Tips

- **Think as if you were explaining to someone**: Imagine teaching the process to a new team member
- **Be specific**: Instead of "System validates data", write "System validates that the email has a valid format and that the password has at least 8 characters"
- **Use examples**: If it helps, add examples of data or scenarios
- **Review with the team**: Ask for feedback to ensure the flow is clear

## 📞 Support

If you have questions about how to create flows, consult the examples in the `flows/` folder or ask the development team for help.

---

**Remember:** Flows are living documentation! Keep them always updated. 🎯

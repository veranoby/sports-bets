# Brain System Setup Guide

## Quick Setup (Copy-Paste Kit)

```bash
# 1. Copy template to new project
cp -r project-brain-template/.gemini ./
cp -r project-brain-template/.claude-code ./
cp project-brain-template/brain/brain_index.json ./brain/

# 2. Update .gitignore
echo "" >> .gitignore
echo "# AI Tools" >> .gitignore  
echo ".gemini/session*" >> .gitignore
echo ".gemini/cache*" >> .gitignore
echo ".claude-code/session*" >> .gitignore
```

## Customization Required

### 1. Update `.gemini/settings.json`
- Replace `TU_API_KEY_AQUI` with your Context7 API key

### 2. Customize `brain/brain_index.json`
Edit these sections:

```json
{
  "metadata": {
    "project_name": "YOUR_PROJECT_NAME",
    "created": "YYYY-MM-DD"
  },
  "project_context": {
    "current_phase": "MVP/Development/Scaling",
    "primary_stakeholder": "Your name/role",
    "tech_stack": {
      "database": "Your database",
      "backend": "Your backend framework", 
      "frontend": "Your frontend framework"
    }
  }
}
```

### 3. Create Project-Specific Brain Files
Create these files in `brain/` directory:

**Required Files:**
- `priorities_memory_index.json` - P0-P3 priorities and deadlines
- `backlog.json` - Current tasks and development tracking
- `sdd_system.json` - Technical architecture and constraints
- `prd_system.json` - Product requirements and stakeholders

**Optional Files:**
- `objectives_memory_index.json` - Strategic goals
- `UI_UX.json` - Design decisions
- `monthly_report.json` - Progress tracking
- `guide_for_using_the_system.json` - Usage procedures

## Testing Setup

```bash
# Test Gemini CLI
cd your-project/
gemini chat "Read brain/brain_index.json and confirm brain system is active"

# Test Claude Code  
claude-code "Check brain system files and current priorities"
```

## File Structure
```
your-project/
├── .gemini/
│   └── settings.json          # Gemini CLI configuration
├── .claude-code/
│   └── instructions.md        # Claude Code brain protocols
├── brain/
│   ├── brain_index.json       # Project detector (required)
│   ├── priorities_memory_index.json
│   ├── backlog.json
│   ├── sdd_system.json
│   └── prd_system.json
└── [your project files]
```

## Validation
- Brain system activates only if `brain/brain_index.json` exists
- AI tools will use project-specific context from brain files
- Generic advice replaced with actual project insights

## Troubleshooting
- **Tools not using brain**: Check `brain/brain_index.json` exists
- **Generic responses**: Verify `.gemini/settings.json` configuration
- **Context7 errors**: Confirm API key is correct
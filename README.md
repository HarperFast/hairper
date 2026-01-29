![](assets/baileys-awesome-logo-for-hairper.png) ![npx -y hairper](./README.svg)

AI to help you with Harper app creation and management.

## Prerequisites

- Node.js (v24 or higher recommended)
- OpenAI API Key: https://platform.openai.com/api-keys

## Getting Started

Grab a key from https://platform.openai.com/api-keys

Create your .env file in your current working directory:

```bash
OPENAI_API_KEY=your_api_key_here
OPENAI_AGENTS_DISABLE_TRACING=1
```

(If you'd rather export these environment variables from within your .zshrc or equivalent file, you can do that instead.)

Now install hairper:

```bash
npm install -g hairper
```

Or run it with npx:

```
npx -y hairper
```

You're ready to go!

```bash
> hairper

Working directory: /Users/dawson/Code/softwork-beats
Harper app detected in it: Yes
Press Ctrl+C or hit enter twice to exit.

Harper: What do you want to do together today?

>
```

### OpenAI API Key Permissions

If you are using a restricted API key, ensure the following permissions are enabled:

- **Models**: `Write` access for `gpt-5.2` (the main model) and `gpt-4o-mini` (the memory summarizer)
- **Model capabilities**: `Write` (to allow tool calling and completions).

No other permissions (like Assistants, Threads, or Files) are required as `hairper` runs its tools locally.

# Contributing to Hairper's Development

If you want to help us advance the source code that powers Hairper, take a look at the steps below!

## Local Development

### Setup

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your_api_key_here
   OPENAI_AGENTS_DISABLE_TRACING=1
   ```

### Running the Agent

To use the `hairper` command globally from your local source so you can use it on other projects:

```bash
npm link
```

Now you can run `hairper` from any directory.

## Usage

Once installed or running, you can ask Hairper to help you with tasks in your current directory, such as applying patches or managing your Harper application.

Press `Ctrl+C` or hit enter twice to exit.

# AI Prompt Library

A modern web application for organizing, managing, and sharing AI prompts. Built with React and Node.js, this application helps teams and individuals maintain a curated collection of effective AI prompts.

## Features

- 📝 Create and edit AI prompts with titles, descriptions, and categories
- 🔍 Powerful search functionality across all prompt fields
- 🏷️ Organize prompts by categories and types
- 🌓 Dark/Light mode support
- 📋 One-click prompt copying
- 🤖 AI-powered title and description suggestions
- 📱 Responsive design for all devices
- ⚡ Real-time updates and filtering

## Tech Stack

- **Frontend**: React with Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **API Integration**: OpenAI API for prompt suggestions
- **Deployment**: Render for hosting

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/wahiggins3/ai-prompt-library.git
   cd ai-prompt-library
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with:
   ```
   OPENAI_API_KEY=your_openai_api_key
   DATABASE_URL=your_postgres_database_url
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Usage

1. **Adding Prompts**:
   - Click "Add Prompt" button
   - Enter prompt text, title, and description
   - Optionally use AI suggestions for title and description
   - Save your prompt

2. **Managing Prompts**:
   - Search prompts using the search bar
   - Filter by category or type
   - Sort by various fields
   - Edit or copy prompts with one click

3. **Organization**:
   - Prompts are organized by categories and types
   - Use filters to quickly find relevant prompts
   - Character count tracking for optimal prompt length

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React and Tailwind CSS
- Uses OpenAI API for intelligent suggestions
- Hosted on Render
- PostgreSQL for reliable data storage

# MoneyTracker

> **Track Every Penny, Shape Your Finances.**  
> A privacy-first, open-source, and AI-powered financial ecosystem built for the modern age.
<!-- 
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/) -->

---

## ✨ Features

- **AI Insights**: Powered by Google Gemini to analyze spending patterns and predict your financial future.
- **Privacy First**: Self-hosted architecture. Your data never leaves your server.
- **Interactive Dashboards**: Beautiful, real-time visualization of your net worth, expenses, and budgets.
- **Subscription Management**: Stop the leaks. Track all recurring payments and get notified before you're charged.
- **Responsive Design**: A high-end experience on Desktop, Tablet, and Mobile.

## 🚀 Quick Start

The fastest way to get MoneyTracker running is via Docker.

### 1. Prerequisites
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### 2. Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/shantnudon/moneytracker.git
   cd moneytracker
   ```

2. **Setup environment variables:**
   Copy the example env file and fill in your secrets (like `JWT_SECRET` and `GEMINI_API_KEY`).
   ```bash
   cp .env.example .env
   ```

3. **Deploy with Docker:**
   ```bash
   docker-compose up -d
   ```

4. **Access the app:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---
## 🤝 Contributing

We love contributions! Whether it's fixing a bug, adding a feature, or improving documentation:

1. **Fork** the repository.
2. Create your **Feature Branch** (`git checkout -b feature/feature`).
3. **Commit** your changes (`git commit -m 'Add some feature'`).
4. **Push** to the branch (`git push origin feature`).
5. Open a **Pull Request**.

Please ensure your code follows our linting rules and includes relevant tests(yet to be implemented).

<!-- ---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information. -->

<!-- ---

## 👤 Author

**Shantnu** - *Indie Developer & Designer*  
- [GitHub](https://github.com/shantnudon)
-->
--- 
*Built with ❤️ for the community.*
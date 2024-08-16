# BasilicaEVM: Modern EVM Development Stack

<img width="892" alt="image" src="https://697788980-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2FZ9TDrZUmPgINqUrCxxId%2Fuploads%2Fae1Zeh49ADF1WWrQ5PIW%2Fimage.png?alt=media&token=daf2165f-f530-4f4e-875b-b6d936012a10">

## Overview

BasilicaEVM is a comprehensive development stack designed for building modern, performant, and scalable EVM-based applications. It combines cutting-edge web technologies with robust blockchain integration, providing developers with a powerful toolkit for creating decentralized applications (dApps) and DeFi platforms. Leveraging the best and fastest development tools, BasilicaEVM ensures a smooth and efficient development process, enabling teams to focus on building innovative Web3 products.

## Features

- 🔄 **0x Integration:** Built-in support for 0x API v2, enabling gassless, efficient and secure asset transfers, swaps, and liquidity aggregation.
- 📊 **Codex Integration:** Streamline your dApp's data management and indexing with Codex, optimizing performance and ensuring scalability.
- 🧩 **Modular Architecture:** Flexible and modular architecture, allowing for easy customization and extension based on your specific project needs.
- 🛠️ **TypeScript SDK:** A robust TypeScript SDK for interacting with 0x, ensuring type safety and a smooth developer experience.
- 👛 **Wallet Integration:** Out-of-the-box wallet integration for secure transactions and user authentication.
- ⚡ **Efficient Dev Workflow:** State of the art devtools and workflows for rapid prototyping, testing, and deployment.
- 🤖 **AI-Assisted Development:** Clear conventions and AI-assisted development using cursor.so and v0.dev
- 📚 **Documentation:** Detailed documentation covering project structure, conventions, and best practices.

## The BasilicaEVM Stack

At its core, the BasilicaEVM Stack leverages:

- **Turbo Monorepo**: Efficient codebase management and optimized build processes for large-scale projects.
- **Bun**: Ultra-fast JavaScript runtime, package manager, and build tool, enhancing development speed and efficiency.
- **Biome**: Modern, fast, and extensible toolchain for web projects, providing linting, formatting, and more.
- **Hardhat**: Robust framework for EVM smart contract development, testing, and deployment.
- **Next.js 14**: Cutting-edge full-stack development with React Server Components, App Router, and server actions.
- **Tailwind CSS & shadcn/ui**: Rapid, customizable UI development with utility-first CSS and accessible component primitives.
- **EVM Integration**:
  - **viem**: Type-safe, lightweight library for low-level EVM interactions.
  - **wagmi**: React hooks for seamless EVM integration.
  - **Rainbow Kit**: Polished, customizable wallet connection UI for enhanced user experience.
  - **Codex API**: Integration with codex.io for enhanced blockchain data and insights.
  - **0x**: Powerful, flexible, and efficient Ethereum development framework for building decentralized applications.

## Project Structure

For detailed information on each component, please refer to their respective README files.

### Applications

- **Webapp (`/apps/webapp`)**: The main front-end application for user interactions. [More details](/apps/webapp/README.md)

### Packages

- **Config TypeScript (`/packages/config-typescript`)**: Shared TypeScript configurations. 
- **Project Contracts (`/packages/app-contracts`)**: Smart contract interfaces, data and utilities. [More details](/packages/app-contracts/README.md)
- **Project Lib (`/packages/project-lib`)**: Shared project library. [More details](/packages/project-lib/README.md)
- **0x API (`/packages/0x-api`)**: SDK for interacting with the 0x API v2. [More details](/packages/0x-api/README.md)

### Hardhat (`/hardhat`)

Contains configurations and scripts for smart contract development, testing, and deployment. [More details](/hardhat/README.md)

## Development Conventions and AI Workflow

We leverage various AI-powered tools to enhance development speed and efficiency:

1. **[Cursor.so](https://cursor.so/) AI Editor**: Our primary code editor for AI-assisted development. Our code style guidelines are detailed in the [.cursorrules](./.cursorrules) file. It is crucial that all team members read and understand these conventions to maintain consistency and efficiency in our development process.

   Key Cursor.so commands:
   - **Prompt an edit**: Highlight code and press Cmd+K
   - **Accept autocomplete**: Press Tab when a suggestion appears
   - **Ask a question**: Use Cmd+L to open chat, @ to import files/docs
   - **Focus AI on code**: Highlight code and press Cmd+Shift+L

   For more features, visit [cursor.sh/features](https://cursor.sh/features). For support, post on [forum.cursor.sh](https://forum.cursor.sh/).

   We recommend using the Claude Sonnet API key in Cursor settings, as this model has shown superiority when dealing with code.

2. **[v0.dev](https://v0.dev/)**: We use this tool to rapidly generate markup for components, streamlining UI development.

3. **[postgres.new](https://postgres.new/)**: This tool assists in database work, allowing for quick schema design and query testing.

These AI-powered tools significantly accelerate our development process, enabling us to focus more on core functionality and complex problem-solving.

## Installation

1. Install Bun globally:
   ```
   curl -fsSL https://bun.sh/install | bash
   ```

2. Clone the repository:
   ```
   git clone https://github.com/your-username/basilica-eth.git
   cd basilica-eth
   ```

3. Install dependencies and start the development server:
   ```
   bun install
   bun dev
   ```

This setup provides a faster JavaScript runtime and efficient package management for enhanced development efficiency.

## Key Benefits

BasilicaEVM provides a state-of-the-art architecture, carefully curated tech stack, and industry-leading patterns and practices, allowing developers to:

1. **Focus on Features**: By providing a robust, pre-configured development environment, BasilicaEVM enables teams to concentrate on building unique features and business logic rather than setting up infrastructure.

2. **Reduce Time to Market**: With its optimized toolchain and ready-to-use components, BasilicaEVM significantly accelerates the development process, helping projects launch faster and iterate more quickly.

3. **Ensure Best Practices**: The stack incorporates established best practices for EVM development, security, and performance, reducing the risk of common pitfalls and vulnerabilities.

4. **Scale Efficiently**: The modular architecture and performance-optimized tools allow applications to scale seamlessly as user bases grow.

5. **Maintain Consistency**: Shared configurations and standardized patterns across the monorepo ensure code consistency and ease of maintenance.

By leveraging BasilicaEVM, development teams can bypass the time-consuming process of assembling and integrating a modern Web3 stack, instead diving directly into creating innovative blockchain-based solutions with confidence.


## Contributing

We welcome contributions from the community. Whether it's code contributions, feedback, or suggestions, your input is valuable to us.

## License

This project is licensed under the MIT License.

# React + Vite

## Docker deployment

The storefront API URL is embedded in the frontend bundle at build time. Because
`.env` files are excluded from the Docker build context, pass the public API URL
explicitly when building the image:

```sh
docker build \
  --build-arg VITE_API_URL=https://api.example.com/api \
  -t mira-frontend .
```

Use the API's public HTTPS URL, not `localhost` or a private container address.
Configure the backend's `FRONTEND_URL` with the storefront's public origin
(scheme and host only) so browser requests pass CORS checks.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

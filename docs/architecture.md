
flowchart TD
    A[index.ts] --> B[reposync.ts]
    B --> C[config/config.ts]
    B --> D[github/repositories.ts]
    D --> E[github/client.ts]
    D --> F[parser/readme-parser.ts]
    B --> G[overrides/overrides.ts]
    B --> H[normalizer.ts]
    H --> I[types/index.ts]
    E --> J[errors.ts]
    D --> J
    F --> K[utils/helpers.ts]
    G --> I
    H --> K


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



parser/readme-parser.ts

flowchart TD
    A[README Markdown] --> B[remark Parser]
    B --> C[Markdown AST]
    C --> D[Extract Headings]
    C --> E[Extract Paragraphs]
    C --> F[Extract Links]
    C --> G[Extract Images]
    D --> H[Identify Relevant Sections]
    E --> I[Extract Introduction]
    H --> J[Extract Features]
    H --> K[Extract Technologies]
    F --> L[Extract Demo URLs]
    G --> M[Extract Preview Images]
    I --> N[READMEExtraction]
    J --> N
    K --> N
    L --> N
    M --> N




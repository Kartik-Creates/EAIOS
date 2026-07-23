# Contributing to EAIOS (Enterprise AI Operating System)

Welcome to EAIOS! To maintain high code quality, system stability, and security standards, all team members (Kartik, Piyush, Harsh, Sahil, Kunal) must follow these workflow guidelines.

---

## 1. Branching Strategy

We use a standard Git feature-branch workflow structured around two main persistent branches:

- **`main`**: Always deployable and demo-ready. Direct pushes are blocked. All releases come from `dev`.
- **`dev`**: Primary integration branch. All feature branches merge into `dev` after code review and CI checks pass.
- **`feature/<name>-<short-description>`**: Individual work branches created off `dev`.

### Naming Conventions for Feature Branches
Examples:
- `feature/piyush-rag-pipeline`
- `feature/harsh-auth`
- `feature/sahil-integrations`
- `feature/kunal-frontend-dashboard`

### Standard Workflow Steps
1. Checkout and pull latest `dev`:
   ```bash
   git checkout dev
   git pull origin dev
   ```
2. Create your feature branch:
   ```bash
   git checkout -b feature/<yourname>-<description>
   ```
3. Commit your changes using standard conventional commit messages (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`).
4. Push your branch to GitHub:
   ```bash
   git push -u origin feature/<yourname>-<description>
   ```
5. Open a Pull Request targeting the **`dev`** branch.

---

## 2. Pull Request & Code Review Rules

- **Standard PR Rule**: Every PR targeting `dev` or `main` requires **at least 1 approval** from a teammate before merging.
- **Sensitive Code Rule (2 Approvals Required)**:
  - Any PR touching authentication (`backend/app/routers/auth.py`), security (`backend/app/core/security.py`), core dependencies (`backend/app/core/*`), permissions, or third-party integrations (`backend/app/integrations/*`) **requires 2 approvals** before merging.
  - Team Rule: `@Kartik-Creates` (or designated security lead) must be one of the reviewers for these paths.

---

## 3. GitHub Branch Protection Setup (Admin Instructions)

For repository administrators with owner access on `https://github.com/Kartik-Creates/EAIOS`:

1. **Branch Protection for `main` and `dev`**:
   - Go to **Settings > Branches > Add branch protection rule**.
   - Set **Branch name pattern**: `main` (and repeat for `dev`).
   - Check **Require a pull request before merging**:
     - Set **Required approvals**: `1`.
     - Check **Require review from Code Owners** (enforces `.github/CODEOWNERS`).
   - Check **Require status checks to pass before merging**:
     - Add status checks: `backend-ci`, `frontend-ci`.
   - Check **Require branches to be up to date before merging**.
   - Check **Do not allow bypassing the above settings**.

---

## 4. Environment & Secrets Safety

- **Never commit `.env` files or real secrets.**
- All environment configurations must use `.env.example` template files with non-sensitive placeholder values.
- Production and CI secrets are managed strictly through **GitHub Actions Secrets**.

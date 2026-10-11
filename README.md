This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Price scrapers

Standalone Python scripts in `scrapers/` pull public promotion data for personal reference. Install the dependency, then run them from that folder:

```bash
pip install -r requirements.txt
cd scrapers
python fairprice.py promo promotions-boost 1
python fairprice.py category rice 1
python fairprice.py search milo 1
python shengsiong_flyers.py
```

`fairprice.py` reads FairPrice product prices and promotions from the public website API (`website-api.omni.fairprice.com.sg/api/product/v2`). It has three modes: `promo` (a promotion tag slug such as `promotions-boost`), `category` (a category slug such as `rice`), and `search` (a query such as `milo`). The last argument is the page number.

`shengsiong_flyers.py` lists recent Sheng Siong promotion flyer posts from the corporate WordPress REST API, including poster image and PDF links.

FairPrice's terms forbid automated data collection and limit use to non-commercial purposes, so keep usage personal and light. The Sheng Siong online shop is behind Incapsula bot protection, so these scripts only cover flyers. The flyer PDFs are image-based, so item prices need OCR.

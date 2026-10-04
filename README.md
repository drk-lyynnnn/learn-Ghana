# Study Bot (free-tier starter)

A chatbot for BECE/WASSCE study help. Static page + one serverless function. No database.

## Run it for free

1. Get a free API key at Google AI Studio (aistudio.google.com).
2. Put this folder on GitHub.
3. Sign up at vercel.com (free plan), import the repo, and add an environment variable:
   `GEMINI_API_KEY` = your key. Optional: `GEMINI_MODEL` (default `gemini-2.5-flash-lite`).
4. Deploy. Your site will be at `something.vercel.app`.

To test on your computer: `npm i -g vercel`, then `vercel dev` (put the key in a `.env` file).

## Add your real content

Edit `data/syllabus.json`. The four entries are PLACEHOLDERS. Replace them with official
WAEC/GES syllabus topics and your own explanations (check copyright before pasting anything
you did not write). Each entry needs: subject, topic, keywords, text. Keep each text short.
More and better entries = better answers.

## Before real students use it

- Check Google's current free-tier terms: free-tier data may be used by Google, and commercial use may be restricted.
- Test 50+ past questions against the marking schemes, especially calculations.
- Free tiers have rate limits; the app shows a "try again" message if they are hit.

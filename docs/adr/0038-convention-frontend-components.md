---
kind: convention
status: accepted
---

# Convention: components

- Use a primitive of `@/components/ui` before you write your own HTML. When the primitive is not there, add it with `pnpm dlx shadcn add <name>` in `frontend/`.
- After `shadcn add`, run `pnpm format`, then fix by hand what Biome still refuses: give each function its return type, and import `cn` from `'cn'`, never from `@/lib/utils`. Change nothing else in the primitive.
- A primitive keeps the lowercase file name that shadcn gives it: `ui/alert.tsx`. A component of our own is `<Name>.tsx`, in PascalCase.
- Style with Tailwind classes only, in the `className` of the element.
- `src/index.css` holds the Tailwind entry and the theme variables, and nothing more. The old classes that are still in it, and the rules that give them back what the preflight of Tailwind removes, go when their part gets Tailwind classes.
- Keep the accessible roles and labels (`role="alert"`, `aria-label`, the headings). The tests find elements by them.
- A component that more than one section uses is in `src/components/`, as `RefusalAlert`.

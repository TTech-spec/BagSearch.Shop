export const sheetList = { hidden: {}, show: { transition: { staggerChildren: 0.035, delayChildren: 0.08 } } };
export const sheetItem = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 420, damping: 32 } },
};

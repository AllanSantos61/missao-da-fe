type BadgeProps = {
  label: string;
  value: string;
};

export function Badge({ label, value }: BadgeProps) {
  return (
    <div className="rounded-full border border-gold/30 bg-altar px-4 py-2 text-sm shadow-sm">
      <span className="text-navy/60">{label}</span>{" "}
      <span className="font-semibold text-navy">{value}</span>
    </div>
  );
}

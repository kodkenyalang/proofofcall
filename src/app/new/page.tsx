import { NewCallForm } from "@/components/NewCallForm";

export default function NewCall() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Make a call</h1>
        <p className="text-sm text-muted">
          Your call is hashed and the hash is written to Solana now, so the timestamp can’t be faked. Entry price is
          the first full minute after your transaction lands. You can’t edit or delete it, and neither can we.
        </p>
      </div>
      <NewCallForm />
    </div>
  );
}

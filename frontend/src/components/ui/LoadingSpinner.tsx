export default function LoadingSpinner({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center w-full h-full min-h-[200px]">
      <div
        style={{
          width: size,
          height: size,
          border: `3px solid rgba(0, 230, 118, 0.15)`,
          borderTop: `3px solid #00E676`,
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

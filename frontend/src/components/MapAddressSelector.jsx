import { useState } from "react";

export default function MapAddressSelector({ initialAddress = "", onConfirm }) {
  const [address, setAddress] = useState(initialAddress);
  const [confirmed, setConfirmed] = useState(initialAddress);

  const handleConfirm = () => {
    if (!address.trim()) return;
    setConfirmed(address);
    onConfirm(address);
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter property address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "8px",
          marginBottom: "10px"
        }}
      />

      <button
        type="button"
        className="btn btn-primary btn-sm"
        onClick={handleConfirm}
      >
        Confirm Address
      </button>

      {confirmed && (
        <div className="map-address-box" style={{ marginTop: "10px" }}>
          Selected Address: {confirmed}
        </div>
      )}
    </div>
  );
}
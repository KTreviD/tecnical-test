import React, { useState } from "react";
import { Box, Button, CircularProgress, TextField, Typography } from "@mui/material";

const App: React.FC = () => {
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePublish = async () => {
    setLoading(true);
    setError(null);
    setScreenshot(null);

    try {
      const response = await fetch("http://localhost:5000/publishVehicle", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price,
          vehicleDescription: description,
        }),
      });

      if (!response.ok) {
        throw new Error("Error en la publicación del anuncio.");
      }

      const data = await response.json();
      if (data.imagesPaths) {
        setScreenshot(data.imagesPaths);
      } else {
        setError("No se pudo obtener el screenshot del anuncio publicado.");
      }
    } catch (err) {
      setError("Error al publicar el anuncio. Por favor, intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        padding: 4,
      }}
    >
      <Typography variant="h4" gutterBottom>
        Publicar Anuncio
      </Typography>
      <TextField label="Precio" value={price} onChange={(e) => setPrice(e.target.value)} fullWidth />
      <TextField label="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} fullWidth multiline rows={4} />
      <Button variant="contained" color="primary" onClick={handlePublish} disabled={loading} fullWidth>
        {loading ? <CircularProgress size={24} /> : "Publicar"}
      </Button>
      {loading && <Typography>Cargando, por favor espera...</Typography>}
      {error && <Typography color="error">{error}</Typography>}
      {screenshot && screenshot.map((path, index) => <Box key={index} component="img" src={path} alt={`Screenshot del anuncio publicado ${index + 1}`} sx={{ width: "100%", maxWidth: 600, marginTop: 3 }} />)}
    </Box>
  );
};

export default App;

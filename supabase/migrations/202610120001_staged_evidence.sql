-- El propietario puede leer su carga todavía no asociada para que el servidor
-- valide los bytes antes de registrarla. Solo mientras su turno esté operativo.
-- No otorga lectura de cargas ajenas ni permisos de actualización/eliminación.
create policy evidence_staged_download on storage.objects
  for select to authenticated
  using (bucket_id = 'evidence' and private.can_upload(name));

import React, { useCallback, useEffect, useRef, useState } from 'react';

const emptyRange = () => ({ start: '', end: '' });

const defaultForm = () => ({
  name: '',
  gateway_id: '',
  index_ranges: [emptyRange()],
  interval_hours: 3,
  pull_from_armoire: true,
  push_to_cloud: true,
  enabled: true,
});

const levelClass = {
  info: '#94a3b8',
  success: '#34d399',
  warn: '#fbbf24',
  error: '#f87171',
};

const SyncCloud = ({ token }) => {
  const [profiles, setProfiles] = useState([]);
  const [gateways, setGateways] = useState([]);
  const [gatewayFilter, setGatewayFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(defaultForm());
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedProfileId, setSelectedProfileId] = useState(null);
  const [runs, setRuns] = useState([]);
  const [runGatewayId, setRunGatewayId] = useState('');
  const [runningId, setRunningId] = useState(null);
  const pollRef = useRef(null);

  const headers = useCallback(
    () => ({
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    }),
    [token],
  );

  const loadGateways = useCallback(async () => {
    try {
      const [gwRes, sessRes] = await Promise.all([
        fetch('/api/admin/gateways', { headers: headers() }),
        fetch('/api/portal/admin/gateway-sessions', { headers: headers() }),
      ]);
      const gwList = gwRes.ok ? await gwRes.json() : [];
      const sessions = sessRes.ok ? await sessRes.json() : [];
      const ids = new Map();
      (Array.isArray(sessions) ? sessions : []).forEach((s) => {
        if (s.gateway_id) ids.set(s.gateway_id, s.gateway_id);
      });
      (Array.isArray(gwList) ? gwList : []).forEach((g) => {
        const id = g.gateway_id || g.hostname;
        if (id) ids.set(id, g.hostname || id);
      });
      setGateways([...ids.entries()].map(([id, label]) => ({ id, label })));
    } catch {
      setGateways([]);
    }
  }, [headers]);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const qs = gatewayFilter ? `?gateway_id=${encodeURIComponent(gatewayFilter)}` : '';
      const res = await fetch(`/api/admin/sync-profiles${qs}`, { headers: headers() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProfiles(Array.isArray(data) ? data : []);
    } catch (e) {
      setError('Impossible de charger les profils sync.');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [gatewayFilter, headers]);

  const loadRuns = useCallback(
    async (profileId) => {
      if (!profileId) return;
      try {
        const res = await fetch(`/api/admin/sync-profiles/${profileId}/runs?limit=10`, {
          headers: headers(),
        });
        if (res.ok) {
          const data = await res.json();
          setRuns(Array.isArray(data) ? data : []);
        }
      } catch {
        setRuns([]);
      }
    },
    [headers],
  );

  useEffect(() => {
    loadGateways();
    loadProfiles();
  }, [loadGateways, loadProfiles]);

  useEffect(() => {
    if (selectedProfileId) loadRuns(selectedProfileId);
  }, [selectedProfileId, loadRuns]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const rangesToApi = (ranges) =>
    ranges
      .filter((r) => r.start !== '' && r.end !== '')
      .map((r) => [parseInt(r.start, 10), parseInt(r.end, 10)]);

  const rangesFromApi = (ranges) =>
    (ranges || []).map(([start, end]) => ({ start: String(start), end: String(end) }));

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...defaultForm(), gateway_id: gatewayFilter || '' });
    setShowForm(true);
  };

  const openEdit = (p) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      gateway_id: p.gateway_id || '',
      index_ranges: rangesFromApi(p.index_ranges).length
        ? rangesFromApi(p.index_ranges)
        : [emptyRange()],
      interval_hours: p.interval_hours || 3,
      pull_from_armoire: p.pull_from_armoire,
      push_to_cloud: p.push_to_cloud,
      enabled: p.enabled,
    });
    setShowForm(true);
  };

  const saveProfile = async () => {
    const body = {
      name: form.name,
      gateway_id: form.gateway_id,
      index_ranges: rangesToApi(form.index_ranges),
      interval_hours: Number(form.interval_hours) || 3,
      pull_from_armoire: form.pull_from_armoire,
      push_to_cloud: form.push_to_cloud,
      enabled: form.enabled,
    };
    if (!body.name || body.index_ranges.length === 0) {
      setError('Nom et au moins une plage d\'indices requis.');
      return;
    }
    const url = editingId ? `/api/admin/sync-profiles/${editingId}` : '/api/admin/sync-profiles';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(body) });
    if (!res.ok) {
      const text = await res.text();
      setError(text || 'Échec enregistrement');
      return;
    }
    setShowForm(false);
    setError('');
    loadProfiles();
  };

  const deleteProfile = async (id) => {
    if (!window.confirm('Supprimer ce profil de sync ?')) return;
    await fetch(`/api/admin/sync-profiles/${id}`, { method: 'DELETE', headers: headers() });
    if (selectedProfileId === id) setSelectedProfileId(null);
    loadProfiles();
  };

  const startPollRuns = (profileId) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadRuns(profileId), 3000);
    setTimeout(() => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 120000);
  };

  const runSync = async (profile) => {
    const gw = runGatewayId || profile.gateway_id || gatewayFilter;
    if (!gw) {
      setError('Sélectionnez une gateway pour lancer la sync.');
      return;
    }
    setRunningId(profile.id);
    setSelectedProfileId(profile.id);
    setError('');
    try {
      const qs = profile.gateway_id ? '' : `?gateway_id=${encodeURIComponent(gw)}`;
      const res = await fetch(`/api/admin/sync-profiles/${profile.id}/run${qs}`, {
        method: 'POST',
        headers: headers(),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      await loadRuns(profile.id);
      startPollRuns(profile.id);
    } catch (e) {
      setError(e.message || 'Échec lancement sync');
    } finally {
      setRunningId(null);
    }
  };

  const expectedCount = (ranges) =>
    (ranges || []).reduce((n, [a, b]) => n + (b - a + 1), 0);

  const chunkHint = (count) => Math.ceil(count / 30) || 0;

  const latestRun = runs[0];
  const consoleLogs = latestRun?.log_lines || [];

  return (
    <div className="catalog-card">
      <h3>Sync Cloud — table de ref</h3>
      <p style={{ fontSize: '0.85em', color: '#9ca3af', marginBottom: '1rem' }}>
        Planification pull armoire → push cloud. Intervalle par défaut : 3 h. Max 30 indices par cycle firmware.
      </p>

      {error && (
        <div style={{ background: '#450a0a', color: '#fecaca', padding: '0.75rem', borderRadius: 6, marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem', alignItems: 'center' }}>
        <label>
          Gateway{' '}
          <select
            value={gatewayFilter}
            onChange={(e) => setGatewayFilter(e.target.value)}
            style={{ marginLeft: 4, padding: 4 }}
          >
            <option value="">Toutes</option>
            {gateways.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </label>
        <label>
          Sync manuelle sur{' '}
          <select value={runGatewayId} onChange={(e) => setRunGatewayId(e.target.value)} style={{ padding: 4 }}>
            <option value="">— profil / filtre —</option>
            {gateways.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </label>
        <button type="button" onClick={openCreate} style={btnPrimary}>Nouveau profil</button>
        <button type="button" onClick={loadProfiles} style={btnSecondary}>Actualiser</button>
      </div>

      {showForm && (
        <div style={{ background: '#1f2937', padding: '1rem', borderRadius: 8, marginBottom: '1rem' }}>
          <h4>{editingId ? 'Modifier profil' : 'Nouveau profil'}</h4>
          <div style={{ display: 'grid', gap: '0.5rem', maxWidth: 480 }}>
            <input
              placeholder="Nom (ex. Planning SDB1)"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <select
              value={form.gateway_id}
              onChange={(e) => setForm({ ...form, gateway_id: e.target.value })}
            >
              <option value="">Toutes gateways (template)</option>
              {gateways.map((g) => (
                <option key={g.id} value={g.id}>{g.label}</option>
              ))}
            </select>
            <label>
              Intervalle (heures){' '}
              <input
                type="number"
                min={1}
                value={form.interval_hours}
                onChange={(e) => setForm({ ...form, interval_hours: e.target.value })}
                style={{ width: 80, marginLeft: 8 }}
              />
            </label>
            {form.index_ranges.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>Indices</span>
                <input
                  type="number"
                  placeholder="début"
                  value={r.start}
                  onChange={(e) => {
                    const next = [...form.index_ranges];
                    next[i] = { ...next[i], start: e.target.value };
                    setForm({ ...form, index_ranges: next });
                  }}
                  style={{ width: 90 }}
                />
                <span>–</span>
                <input
                  type="number"
                  placeholder="fin"
                  value={r.end}
                  onChange={(e) => {
                    const next = [...form.index_ranges];
                    next[i] = { ...next[i], end: e.target.value };
                    setForm({ ...form, index_ranges: next });
                  }}
                  style={{ width: 90 }}
                />
                {form.index_ranges.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        index_ranges: form.index_ranges.filter((_, j) => j !== i),
                      })
                    }
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm({ ...form, index_ranges: [...form.index_ranges, emptyRange()] })}
              style={btnSecondary}
            >
              + Plage
            </button>
            <label><input type="checkbox" checked={form.pull_from_armoire} onChange={(e) => setForm({ ...form, pull_from_armoire: e.target.checked })} /> Pull armoire</label>
            <label><input type="checkbox" checked={form.push_to_cloud} onChange={(e) => setForm({ ...form, push_to_cloud: e.target.checked })} /> Push cloud</label>
            <label><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Actif</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={saveProfile} style={btnPrimary}>Enregistrer</button>
              <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>Annuler</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <p>Chargement…</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Gateway</th>
                <th>Plages</th>
                <th>Intervalle</th>
                <th>Dernière sync</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => {
                const exp = expectedCount(p.index_ranges);
                return (
                  <tr
                    key={p.id}
                    style={{ background: selectedProfileId === p.id ? '#1e3a5f' : undefined }}
                    onClick={() => setSelectedProfileId(p.id)}
                  >
                    <td>{p.name}{!p.enabled && ' (off)'}</td>
                    <td>{p.gateway_id || '— toutes —'}</td>
                    <td style={{ fontSize: '0.85em' }}>
                      {(p.index_ranges || []).map(([a, b]) => `${a}–${b}`).join(', ')}
                      <br />
                      <span style={{ color: '#6b7280' }}>{exp} oct · {chunkHint(exp)} cycle(s)</span>
                    </td>
                    <td>{p.interval_hours} h</td>
                    <td style={{ fontSize: '0.85em' }}>
                      {p.last_run_at ? new Date(p.last_run_at).toLocaleString('fr-FR') : '—'}
                      {p.last_run_status && <><br />{p.last_run_status}</>}
                      {p.next_run_at && p.enabled && (
                        <><br /><span style={{ color: '#6b7280' }}>Prochaine : {new Date(p.next_run_at).toLocaleString('fr-FR')}</span></>
                      )}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button type="button" style={btnSecondary} onClick={() => openEdit(p)}>Éditer</button>{' '}
                      <button
                        type="button"
                        style={btnPrimary}
                        disabled={runningId === p.id}
                        onClick={() => runSync(p)}
                      >
                        {runningId === p.id ? 'Sync…' : 'Sync now'}
                      </button>{' '}
                      <button type="button" style={{ ...btnSecondary, color: '#f87171' }} onClick={() => deleteProfile(p.id)}>Suppr.</button>
                    </td>
                  </tr>
                );
              })}
              {profiles.length === 0 && (
                <tr><td colSpan={6} className="empty-state">Aucun profil — les templates seed apparaissent après migration.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedProfileId && (
        <div style={{ marginTop: '1.5rem', background: '#0f172a', borderRadius: 8, padding: '1rem' }}>
          <h4>Console — dernier run</h4>
          {latestRun ? (
            <>
              <p style={{ fontSize: '0.85em', color: '#94a3b8' }}>
                Statut : <strong>{latestRun.status}</strong>
                {' · '}{latestRun.received_count}/{latestRun.expected_count} octets
                {latestRun.started_at && ` · début ${new Date(latestRun.started_at).toLocaleString('fr-FR')}`}
              </p>
              <div
                style={{
                  maxHeight: 160,
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  marginTop: 8,
                }}
              >
                {consoleLogs.length === 0 ? (
                  <p style={{ color: '#64748b' }}>En attente gateway (Phase 2 scheduler)…</p>
                ) : (
                  consoleLogs.map((line, i) => (
                    <div key={i} style={{ marginBottom: 4 }}>
                      <span style={{ color: '#475569' }}>
                        {new Date(line.time).toLocaleTimeString('fr-FR')}
                      </span>{' '}
                      <span style={{ color: levelClass[line.level] || '#cbd5e1' }}>{line.message}</span>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <p style={{ color: '#64748b' }}>Aucun run — cliquez Sync now.</p>
          )}
        </div>
      )}
    </div>
  );
};

const btnPrimary = {
  padding: '6px 12px',
  background: '#00C9FF',
  color: '#000',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
  fontWeight: 600,
};

const btnSecondary = {
  padding: '6px 12px',
  background: '#374151',
  color: '#e5e7eb',
  border: 'none',
  borderRadius: 4,
  cursor: 'pointer',
};

export default SyncCloud;

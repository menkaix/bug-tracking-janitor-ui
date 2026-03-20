import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Box,
  Tabs,
  Tab,
  Stack,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Divider,
  Chip,
  alpha,
  useTheme,
  Link,
  Tooltip,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Add as AddIcon,
  Comment as CommentIcon,
  Link as LinkIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material';
import { formatDateTime } from '../../utils/dateUtils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = formatDateTime;

const authorInitials = (author) =>
  (author || '')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

// ─── Panel Commentaires ───────────────────────────────────────────────────────

const CommentsPanel = ({ comments = [], onChange }) => {
  const theme = useTheme();
  const [form, setForm] = useState({ author: '', text: '' });

  const handleAdd = () => {
    if (!form.author.trim() || !form.text.trim()) return;
    onChange([...comments, { author: form.author.trim(), text: form.text.trim(), createDate: new Date().toISOString() }]);
    setForm({ author: '', text: '' });
  };

  const handleDelete = (item) => {
    onChange(comments.filter((c) => c !== item));
  };

  const sorted = [...comments].sort((a, b) => new Date(b.createDate) - new Date(a.createDate));

  return (
    <Box>
      {sorted.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          Aucun commentaire pour le moment.
        </Typography>
      ) : (
        <List disablePadding>
          {sorted.map((c, idx) => (
            <React.Fragment key={idx}>
              <ListItem alignItems="flex-start" sx={{ px: 0, py: 1 }}>
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    mr: 1.5,
                    mt: 0.5,
                    fontSize: '0.75rem',
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                    color: 'primary.main',
                    flexShrink: 0,
                  }}
                >
                  {authorInitials(c.author)}
                </Avatar>
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="subtitle2" fontWeight={600}>{c.author}</Typography>
                      <Typography variant="caption" color="text.secondary">{formatDate(c.createDate)}</Typography>
                    </Stack>
                  }
                  secondary={
                    <Box
                      component="span"
                      sx={{
                        display: 'block',
                        mt: 0.25,
                        fontSize: '0.875rem',
                        color: 'text.secondary',
                        '& p': { m: 0 },
                        '& p + p': { mt: 0.5 },
                        '& ul, & ol': { pl: 2, my: 0.25 },
                        '& li': { mb: 0 },
                        '& code': {
                          fontFamily: 'monospace',
                          fontSize: '0.8em',
                          bgcolor: 'action.hover',
                          px: 0.5,
                          borderRadius: 0.5,
                        },
                        '& pre': {
                          bgcolor: 'action.hover',
                          p: 1,
                          borderRadius: 1,
                          overflow: 'auto',
                          fontSize: '0.8em',
                        },
                        '& a': { color: 'primary.main' },
                        '& strong': { fontWeight: 600 },
                        '& blockquote': {
                          borderLeft: '3px solid',
                          borderColor: 'divider',
                          pl: 1,
                          ml: 0,
                          color: 'text.disabled',
                        },
                      }}
                    >
                      <ReactMarkdown>{c.text}</ReactMarkdown>
                    </Box>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton size="small" onClick={() => handleDelete(c)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              {idx < sorted.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Formulaire d'ajout */}
      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
          Ajouter un commentaire
        </Typography>
        <Stack spacing={1.5}>
          <TextField
            size="small"
            label="Auteur"
            value={form.author}
            onChange={(e) => setForm({ ...form, author: e.target.value })}
            fullWidth
          />
          <TextField
            size="small"
            label="Commentaire"
            value={form.text}
            onChange={(e) => setForm({ ...form, text: e.target.value })}
            multiline
            rows={2}
            fullWidth
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) handleAdd();
            }}
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={!form.author.trim() || !form.text.trim()}
            sx={{ alignSelf: 'flex-start', borderRadius: 2 }}
          >
            Ajouter
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

// ─── Panel Liens ──────────────────────────────────────────────────────────────

const LinksPanel = ({ links = [], onChange }) => {
  const [form, setForm] = useState({ name: '', href: '', version: '' });

  const handleAdd = () => {
    if (!form.href.trim()) return;
    onChange([...links, { name: form.name.trim(), href: form.href.trim(), version: form.version.trim(), createDate: new Date().toISOString() }]);
    setForm({ name: '', href: '', version: '' });
  };

  const handleDelete = (item) => {
    onChange(links.filter((l) => l !== item));
  };

  const sorted = [...links].sort((a, b) => new Date(b.createDate) - new Date(a.createDate));

  return (
    <Box>
      {sorted.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          Aucun lien pour le moment.
        </Typography>
      ) : (
        <List disablePadding>
          {sorted.map((l, idx) => (
            <React.Fragment key={idx}>
              <ListItem sx={{ px: 0, py: 1 }}>
                <LinkIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary', flexShrink: 0 }} />
                <ListItemText
                  primary={
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Link href={l.href} target="_blank" rel="noopener" variant="body2" fontWeight={600} underline="hover">
                        {l.name || l.href}
                        <OpenInNewIcon sx={{ fontSize: 12, ml: 0.5, verticalAlign: 'middle' }} />
                      </Link>
                      {l.version && <Chip label={`v${l.version}`} size="small" variant="outlined" sx={{ height: 18, fontSize: '0.65rem' }} />}
                    </Stack>
                  }
                  secondary={
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                        {l.href}
                      </Typography>
                      {l.createDate && (
                        <Typography variant="caption" color="text.disabled">{formatDate(l.createDate)}</Typography>
                      )}
                    </Stack>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton size="small" onClick={() => handleDelete(l)} color="error">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              {idx < sorted.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      )}

      {/* Formulaire d'ajout */}
      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 2,
          border: 1,
          borderColor: 'divider',
          bgcolor: 'background.default',
        }}
      >
        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
          Ajouter un lien
        </Typography>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Nom"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              sx={{ flex: 2 }}
            />
            <TextField
              size="small"
              label="Version"
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
              sx={{ flex: 1 }}
              placeholder="ex: 1.0"
            />
          </Stack>
          <TextField
            size="small"
            label="URL *"
            value={form.href}
            onChange={(e) => setForm({ ...form, href: e.target.value })}
            fullWidth
            placeholder="https://..."
          />
          <Button
            size="small"
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAdd}
            disabled={!form.href.trim()}
            sx={{ alignSelf: 'flex-start', borderRadius: 2 }}
          >
            Ajouter
          </Button>
        </Stack>
      </Box>
    </Box>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────

/**
 * AbstractEntityEditor
 *
 * Composant contrôlé pour gérer les commentaires et liens d'une AbstractEntity.
 *
 * Props:
 *   comments    : Comment[]  — tableau courant
 *   links       : Link[]     — tableau courant
 *   onChangeComments : (Comment[]) => void
 *   onChangeLinks    : (Link[]) => void
 */
const AbstractEntityEditor = ({ comments = [], links = [], onChangeComments, onChangeLinks }) => {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab
          label={
            <Stack direction="row" spacing={0.75} alignItems="center">
              <CommentIcon fontSize="small" />
              <span>Commentaires</span>
              {comments.length > 0 && (
                <Chip label={comments.length} size="small" color="primary" sx={{ height: 18, fontSize: '0.65rem' }} />
              )}
            </Stack>
          }
          sx={{ textTransform: 'none', minHeight: 40 }}
        />
        <Tab
          label={
            <Stack direction="row" spacing={0.75} alignItems="center">
              <LinkIcon fontSize="small" />
              <span>Liens</span>
              {links.length > 0 && (
                <Chip label={links.length} size="small" color="secondary" sx={{ height: 18, fontSize: '0.65rem' }} />
              )}
            </Stack>
          }
          sx={{ textTransform: 'none', minHeight: 40 }}
        />
      </Tabs>

      {tab === 0 && <CommentsPanel comments={comments} onChange={onChangeComments} />}
      {tab === 1 && <LinksPanel links={links} onChange={onChangeLinks} />}
    </Box>
  );
};

export default AbstractEntityEditor;

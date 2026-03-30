import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Box,
  Chip,
  CircularProgress,
  Stack,
  Tooltip,
  Typography,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ChatBubbleOutline as CommentIcon,
  OpenInNew as LinkIcon,
} from '@mui/icons-material';
import backlogService from '../../services/backlog.service';
import { formatDate } from '../../utils/dateUtils';

/**
 * Panneau compact affichant les commentaires et liens d'une issue.
 * Se charge automatiquement via React Query (résultat mis en cache).
 */
const IssueDetailsPanel = ({ issueId }) => {
  const theme = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ['issue-details', issueId],
    queryFn: async () => {
      const result = await backlogService.getEntity('tasks', issueId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 3 * 60 * 1000,
  });

  const comments = data?.comments || [];
  const links = data?.links || [];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
        <CircularProgress size={10} />
      </Box>
    );
  }

  if (comments.length === 0 && links.length === 0) return null;

  return (
    <Stack spacing={0.5} sx={{ mt: 0.75 }}>
      {/* Liens */}
      {links.length > 0 && (
        <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
          {links.map((link, i) => (
            <Chip
              key={i}
              label={link.name || link.href}
              size="small"
              icon={<LinkIcon sx={{ fontSize: '0.7rem !important' }} />}
              onClick={(e) => {
                e.stopPropagation();
                window.open(link.href, '_blank', 'noopener,noreferrer');
              }}
              sx={{
                height: 18,
                fontSize: '0.65rem',
                cursor: 'pointer',
                backgroundColor: alpha(theme.palette.info.main, 0.1),
                color: theme.palette.info.dark,
                '& .MuiChip-icon': { color: theme.palette.info.dark },
                '&:hover': { backgroundColor: alpha(theme.palette.info.main, 0.2) },
                maxWidth: 160,
              }}
            />
          ))}
        </Stack>
      )}

      {/* Commentaires */}
      {comments.length > 0 && (
        <Stack spacing={0.25}>
          {comments.map((comment, i) => (
            <Tooltip
              key={i}
              title={
                <Box>
                  <Typography variant="caption" fontWeight={700}>{comment.author}</Typography>
                  {comment.createDate && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      · {formatDate(comment.createDate)}
                    </Typography>
                  )}
                  <Typography variant="body2" sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}>
                    {comment.text}
                  </Typography>
                </Box>
              }
              placement="bottom-start"
              arrow
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 0.5,
                  cursor: 'default',
                  p: 0.25,
                  borderRadius: 0.5,
                  '&:hover': { backgroundColor: alpha(theme.palette.action.hover, 0.5) },
                }}
              >
                <CommentIcon sx={{ fontSize: '0.7rem', color: 'text.disabled', mt: '2px', flexShrink: 0 }} />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 220,
                    display: 'block',
                  }}
                >
                  <Box component="span" sx={{ fontWeight: 600, mr: 0.5 }}>
                    {comment.author}
                  </Box>
                  {comment.text}
                </Typography>
              </Box>
            </Tooltip>
          ))}
        </Stack>
      )}
    </Stack>
  );
};

export default IssueDetailsPanel;

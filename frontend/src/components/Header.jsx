import React from 'react';
import { AppBar, Toolbar, IconButton, Badge, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Notifications, AccountCircle } from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
  grow: {
    flexGrow: 1,
  },
  title: {
    display: 'none',
    [theme.breakpoints.up('sm')]: {
      display: 'block',
    },
  },
}));

function Header() {
  const classes = useStyles();

  return (
    <AppBar position="fixed">
      <Toolbar>
        <Typography className={classes.title} variant="h6" noWrap>
          Dashboard
        </Typography>
        <div className={classes.grow} />
        <IconButton color="inherit">
          <Badge badgeContent={4} color="secondary">
            <Notifications />   
          </Badge>
        </IconButton>
        <IconButton color="inherit">
          <AccountCircle />
        </IconButton>
      </Toolbar>
    </AppBar>
  );
}

export default Header;

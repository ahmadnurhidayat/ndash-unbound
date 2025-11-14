#!/bin/bash

# NDash - Unbound Management Helper Script
# Quick commands for managing Unbound DNS zones

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  NDash - Unbound Management Helper${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check Unbound status
check_unbound_status() {
    echo -e "${YELLOW}Checking Unbound status...${NC}"
    sudo systemctl status unbound --no-pager | grep "Active:"
    echo ""
}

# Function to reload Unbound
reload_unbound() {
    echo -e "${YELLOW}Reloading Unbound...${NC}"
    sudo unbound-control reload
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Unbound reloaded successfully${NC}"
    else
        echo -e "${RED}✗ Failed to reload Unbound${NC}"
    fi
    echo ""
}

# Function to check Unbound configuration
check_config() {
    echo -e "${YELLOW}Checking Unbound configuration...${NC}"
    sudo unbound-checkconf
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Configuration is valid${NC}"
    else
        echo -e "${RED}✗ Configuration has errors${NC}"
    fi
    echo ""
}

# Function to list local zones
list_zones() {
    echo -e "${YELLOW}Local zones configured in /etc/unbound/local.d:${NC}"
    if [ -d "/etc/unbound/local.d" ]; then
        ls -1 /etc/unbound/local.d/*.conf 2>/dev/null | while read file; do
            zonename=$(basename "$file" .conf)
            echo -e "  ${GREEN}•${NC} $zonename"
        done
    else
        echo -e "${RED}  No local zones directory found${NC}"
    fi
    echo ""
}

# Function to view zone configuration
view_zone() {
    if [ -z "$1" ]; then
        echo -e "${RED}✗ Please provide zone name${NC}"
        echo -e "  Usage: $0 view <zonename>${NC}"
        return 1
    fi
    
    ZONE_FILE="/etc/unbound/local.d/$1.conf"
    
    if [ ! -f "$ZONE_FILE" ]; then
        echo -e "${RED}✗ Zone file not found: $ZONE_FILE${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Zone configuration for: ${GREEN}$1${NC}"
    echo -e "${BLUE}----------------------------------------${NC}"
    cat "$ZONE_FILE"
    echo -e "${BLUE}----------------------------------------${NC}"
    echo ""
}

# Function to flush zone cache
flush_zone() {
    if [ -z "$1" ]; then
        echo -e "${RED}✗ Please provide zone name${NC}"
        echo -e "  Usage: $0 flush <zonename>${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Flushing cache for zone: ${GREEN}$1${NC}"
    sudo unbound-control flush_zone "$1"
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Cache flushed for $1${NC}"
    else
        echo -e "${RED}✗ Failed to flush cache${NC}"
    fi
    echo ""
}

# Function to flush all cache
flush_all() {
    echo -e "${YELLOW}Flushing all cache...${NC}"
    sudo unbound-control flush_zone .
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ All cache flushed${NC}"
    else
        echo -e "${RED}✗ Failed to flush cache${NC}"
    fi
    echo ""
}

# Function to get statistics
show_stats() {
    echo -e "${YELLOW}Unbound statistics:${NC}"
    sudo unbound-control stats_noreset | head -20
    echo ""
}

# Function to backup zone
backup_zone() {
    if [ -z "$1" ]; then
        echo -e "${RED}✗ Please provide zone name${NC}"
        echo -e "  Usage: $0 backup <zonename>${NC}"
        return 1
    fi
    
    ZONE_FILE="/etc/unbound/local.d/$1.conf"
    BACKUP_DIR="/etc/unbound/local.d/backups"
    
    if [ ! -f "$ZONE_FILE" ]; then
        echo -e "${RED}✗ Zone file not found: $ZONE_FILE${NC}"
        return 1
    fi
    
    sudo mkdir -p "$BACKUP_DIR"
    BACKUP_FILE="$BACKUP_DIR/$1.$(date +%Y%m%d_%H%M%S).conf"
    
    echo -e "${YELLOW}Backing up zone: ${GREEN}$1${NC}"
    sudo cp "$ZONE_FILE" "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Backup created: $BACKUP_FILE${NC}"
    else
        echo -e "${RED}✗ Failed to create backup${NC}"
    fi
    echo ""
}

# Function to restore zone from backup
restore_zone() {
    if [ -z "$1" ] || [ -z "$2" ]; then
        echo -e "${RED}✗ Please provide zone name and backup file${NC}"
        echo -e "  Usage: $0 restore <zonename> <backup_file>${NC}"
        return 1
    fi
    
    ZONE_FILE="/etc/unbound/local.d/$1.conf"
    
    if [ ! -f "$2" ]; then
        echo -e "${RED}✗ Backup file not found: $2${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Restoring zone from backup: ${GREEN}$2${NC}"
    sudo cp "$2" "$ZONE_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Zone restored${NC}"
        reload_unbound
    else
        echo -e "${RED}✗ Failed to restore zone${NC}"
    fi
    echo ""
}

# Function to show help
show_help() {
    echo -e "${YELLOW}Available commands:${NC}"
    echo -e "  ${GREEN}status${NC}          - Check Unbound service status"
    echo -e "  ${GREEN}reload${NC}          - Reload Unbound configuration"
    echo -e "  ${GREEN}check${NC}           - Validate Unbound configuration"
    echo -e "  ${GREEN}list${NC}            - List all configured local zones"
    echo -e "  ${GREEN}view <zone>${NC}     - View zone configuration"
    echo -e "  ${GREEN}flush <zone>${NC}    - Flush cache for specific zone"
    echo -e "  ${GREEN}flush-all${NC}       - Flush all cache"
    echo -e "  ${GREEN}stats${NC}           - Show Unbound statistics"
    echo -e "  ${GREEN}backup <zone>${NC}   - Backup zone configuration"
    echo -e "  ${GREEN}restore <zone> <backup>${NC} - Restore zone from backup"
    echo -e "  ${GREEN}help${NC}            - Show this help message"
    echo ""
}

# Main script logic
case "$1" in
    status)
        check_unbound_status
        ;;
    reload)
        reload_unbound
        ;;
    check)
        check_config
        ;;
    list)
        list_zones
        ;;
    view)
        view_zone "$2"
        ;;
    flush)
        flush_zone "$2"
        ;;
    flush-all)
        flush_all
        ;;
    stats)
        show_stats
        ;;
    backup)
        backup_zone "$2"
        ;;
    restore)
        restore_zone "$2" "$3"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}✗ Unknown command: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac

exit 0

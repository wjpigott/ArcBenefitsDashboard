# Arc Software Assurance Benefits Dashboard

A simple, interactive dashboard to help organizations track and maximize their Windows Software Assurance benefits. This tool visualizes available benefits, identifies unused opportunities, and calculates potential savings.

## 🎯 Purpose

Many organizations with Software Assurance (SA) subscriptions don't fully utilize all the benefits they're paying for. This dashboard helps:

- **Visualize** all available SA benefits in one place
- **Identify** unused benefits that could save money or improve operations
- **Track** which benefits are actively being used
- **Calculate** potential cost savings from unused benefits
- **Discover** free benefits included with SA that many organizations overlook

## ✨ Features

### Dashboard Overview
- **Real-time Statistics**: See total benefits, unused benefits, active benefits, and potential savings at a glance
- **Visual Indicators**: Color-coded cards show benefit status (active/unused) and type (free/paid)
- **Filtering**: Filter benefits by category (free items, training, deployment, security) and status (active/unused)

### Benefit Categories
- **Free Items**: Benefits included at no additional cost with SA
- **Training & Support**: Learning resources and technical support options
- **Deployment Rights**: Licensing flexibility and deployment capabilities
- **Security & Compliance**: Security updates and compliance features

### Interactive Features
- **Toggle Benefits**: Mark benefits as active or inactive
- **Recommendations**: Get personalized suggestions for high-value unused benefits
- **Export Reports**: Generate JSON reports of your current benefit usage
- **Detailed Views**: View comprehensive information about each benefit

### Free Benefits Sidebar
A dedicated section highlighting free benefits that many organizations don't realize they have access to, including:
- Windows 365 Cloud PC Access
- Azure Hybrid Benefit
- Extended Security Updates (ESU)
- Home Use Program
- Disaster Recovery Rights
- Windows Autopatch
- And more!

## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Edge, Firefox, Safari)
- No server or build tools required - this is a static web application

### Installation

1. **Clone or download** this repository to your local machine
2. **Navigate** to the `sa-benefits-dashboard` directory
3. **Open** `index.html` in your web browser

That's it! The dashboard will load with sample data.

### Project Structure
```
sa-benefits-dashboard/
├── index.html              # Main dashboard page
├── assets/
│   ├── app.js             # JavaScript functionality
│   └── styles.css         # Dashboard styling
├── data/
│   └── benefits.json      # Benefits data (customize this!)
└── README.md              # This file
```

## 📊 Customizing Your Data

To customize the dashboard for your organization:

1. **Edit** `data/benefits.json`
2. **Add, modify, or remove** benefits based on your SA agreement
3. **Update** the `isActive` field to reflect your current usage
4. **Adjust** `estimatedValue` based on your organization's context
5. **Refresh** the dashboard to see your changes

### Data Format
Each benefit in `benefits.json` follows this structure:

```json
{
  "id": "unique-id",
  "name": "Benefit Name",
  "description": "Brief description",
  "category": "free|training|deployment|security",
  "isFree": true|false,
  "isActive": true|false,
  "estimatedValue": 5000,
  "details": "Detailed information",
  "activationSteps": "How to activate this benefit"
}
```

## 💡 Use Cases

### For IT Leadership
- Identify cost-saving opportunities
- Justify SA renewal decisions
- Plan training and support strategies
- Present ROI to stakeholders

### For IT Operations
- Discover deployment rights that could simplify infrastructure
- Find free tools and services already available
- Plan migration strategies using SA benefits

### For Compliance Teams
- Track security update coverage
- Document disaster recovery capabilities
- Ensure proper license utilization

## 🔄 Iteration Plan

This is a starter kit designed to grow with your needs. Future enhancements could include:

### Phase 2 - Data Integration
- [ ] Connect to Microsoft Volume Licensing Service Center API
- [ ] Automatic benefit eligibility checking
- [ ] Real-time license inventory

### Phase 3 - Advanced Analytics
- [ ] Historical usage tracking
- [ ] ROI calculations and trending
- [ ] Predictive recommendations

### Phase 4 - Collaboration
- [ ] Multi-user support
- [ ] Approval workflows for benefit activation
- [ ] Notification system for expiring benefits

### Phase 5 - Reporting
- [ ] PDF report generation
- [ ] Executive dashboards
- [ ] Integration with Power BI

## 🛠️ Technical Details

### Technologies Used
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with CSS Grid and Flexbox
- **Vanilla JavaScript**: No dependencies or frameworks
- **JSON**: Simple data storage

### Browser Compatibility
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- IE11 not supported

### Performance
- Lightweight: < 100KB total
- Instant loading on modern hardware
- No external API calls required (unless customized)

## 🤝 Contributing

This is a starter project designed to be customized. Feel free to:
- Modify the UI to match your organization's branding
- Add new benefit categories
- Integrate with your existing systems
- Enhance the recommendation engine

## 📝 Sample Benefits Included

The dashboard comes pre-populated with 15 common SA benefits:

**Free Benefits:**
- Windows 365 Cloud PC Access
- Azure Hybrid Benefit
- Extended Security Updates
- Home Use Program
- Disaster Recovery Rights
- License Mobility
- Version Upgrade Rights
- SQL Server Developer Edition
- Windows Virtual Desktop Access
- Windows Autopatch

**Training & Support:**
- Planning Services
- Training Vouchers
- 24/7 Technical Support

**Deployment:**
- Windows Server Datacenter Unlimited Virtualization
- Spread Payments

## 📞 Support

For questions about:
- **Software Assurance benefits**: Contact your Microsoft account team or visit the [Volume Licensing Service Center](https://www.microsoft.com/licensing/servicecenter/)
- **This dashboard**: Customize and extend as needed for your organization

## 📄 License

This is a starter template provided for demonstration purposes. Customize freely for your organization's needs.

## 🎓 Learning Resources

- [Software Assurance Benefits](https://www.microsoft.com/licensing/licensing-programs/software-assurance-default)
- [Azure Hybrid Benefit](https://azure.microsoft.com/pricing/hybrid-benefit/)
- [Volume Licensing Service Center](https://www.microsoft.com/licensing/servicecenter/)

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Built for**: Microsoft Arc Teams

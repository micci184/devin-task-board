import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.taskCategory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.category.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const adminUser = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "Admin User",
      password: "$2b$10$devinTaskBoardPlaceholderHash",
      role: "ADMIN",
      locale: "ja",
      theme: "SYSTEM",
    },
  });

  const memberUser = await prisma.user.create({
    data: {
      email: "member@example.com",
      name: "Member User",
      password: "$2b$10$devinTaskBoardPlaceholderHash",
      role: "MEMBER",
      locale: "ja",
      theme: "SYSTEM",
    },
  });

  const project = await prisma.project.create({
    data: {
      name: "Devin Task Board",
      key: "DTB",
      description: "Issue #3 seed project",
      ownerId: adminUser.id,
    },
  });

  await prisma.projectMember.createMany({
    data: [
      {
        projectId: project.id,
        userId: adminUser.id,
        role: "OWNER",
      },
      {
        projectId: project.id,
        userId: memberUser.id,
        role: "MEMBER",
      },
    ],
  });

  const [backendCategory, designCategory] = await Promise.all([
    prisma.category.create({
      data: {
        projectId: project.id,
        name: "backend",
        color: "oklch(0.55 0.12 250)",
      },
    }),
    prisma.category.create({
      data: {
        projectId: project.id,
        name: "design",
        color: "oklch(0.7 0.15 50)",
      },
    }),
  ]);

  const task1 = await prisma.task.create({
    data: {
      taskNumber: 1,
      title: "環境構築を完了する",
      description: "Docker Compose + Prisma の初期セットアップ",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: project.id,
      assigneeId: memberUser.id,
      reporterId: adminUser.id,
      sortOrder: 1,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      taskNumber: 2,
      title: "UIテーマを実装する",
      description: "OKLCH のテーマ変数を追加",
      status: "TODO",
      priority: "MEDIUM",
      projectId: project.id,
      assigneeId: memberUser.id,
      reporterId: adminUser.id,
      sortOrder: 2,
    },
  });

  await prisma.taskCategory.createMany({
    data: [
      {
        taskId: task1.id,
        categoryId: backendCategory.id,
      },
      {
        taskId: task2.id,
        categoryId: designCategory.id,
      },
    ],
  });

  await prisma.comment.create({
    data: {
      taskId: task1.id,
      authorId: adminUser.id,
      content: "セットアップ手順を README に追記しました。",
    },
  });

  await prisma.activityLog.create({
    data: {
      action: "CREATED",
      entityType: "task",
      entityId: task1.id,
      userId: adminUser.id,
      projectId: project.id,
      newValue: {
        title: task1.title,
        status: task1.status,
      },
    },
  });

  await prisma.notification.create({
    data: {
      type: "TASK_ASSIGNED",
      title: "タスクが割り当てられました",
      message: "環境構築を完了する があなたに割り当てられました。",
      userId: memberUser.id,
      linkUrl: `/tasks/${task1.id}`,
      isRead: false,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "SEED_EXECUTED",
      userId: adminUser.id,
      resource: "seed",
      resourceId: project.id,
      details: {
        users: 2,
        tasks: 2,
      },
    },
  });

  console.log("Seed completed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
